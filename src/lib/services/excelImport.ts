import ExcelJS from "exceljs";
import { getDb, setConfig } from "../db/sqlite";
import { DIMENSION_COLUMNS, EXCEL_HEADER_ALIASES, MODULE_KEYS } from "../modules";

function normalizeHeader(h: string): string {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .replace(/\s+/g, "_");
}

function cellToPrimitive(value: ExcelJS.CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    // Celdas con formula: usamos el resultado calculado, no la formula.
    if ("result" in value || "formula" in value || "sharedFormula" in value) {
      const result = (value as { result?: ExcelJS.CellValue }).result;
      if (result && typeof result === "object" && "error" in result) return null;
      return cellToPrimitive(result ?? null);
    }
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
    if ("text" in value) return cellToPrimitive((value as { text: ExcelJS.CellValue }).text);
    if ("error" in value) return null;
    return String(value);
  }
  return value as string | number;
}

export interface ImportResult {
  sheetUsed: string;
  rowsImported: number;
  unmappedColumns: string[];
}

type SheetRecord = Record<string, string | number | null>;

interface ParsedSheet {
  name: string;
  columns: string[];
  records: SheetRecord[];
}

function readSheet(sheet: ExcelJS.Worksheet): ParsedSheet {
  const headerMap = new Map<number, string>();
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const raw = normalizeHeader(cellToPrimitive(cell.value)?.toString() ?? "");
    headerMap.set(colNumber, EXCEL_HEADER_ALIASES[raw] ?? raw);
  });

  const records: SheetRecord[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const record: SheetRecord = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headerMap.get(colNumber);
      if (key) record[key] = cellToPrimitive(cell.value);
    });
    if (!record.cod_ipress && record.ipress) record.cod_ipress = codIpressFromName(record.ipress);
    if (record.cod_ipress != null) record.cod_ipress = String(record.cod_ipress).trim();
    records.push(record);
  });

  return { name: sheet.name, columns: Array.from(headerMap.values()), records };
}

// El nombre de la IPRESS viene como "I-2 - 3426 - SANTA ROSA": el segundo tramo es el codigo.
function codIpressFromName(ipress: string | number): string | null {
  const parts = String(ipress).split(/\s+-\s+/);
  return parts.length >= 3 && /^\d+$/.test(parts[1]) ? parts[1] : null;
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

/**
 * Importa la hoja principal (la llamada "BASE", o si no existe, la primera con
 * columnas "ipress" y "periodo") y la completa con las demas hojas que tengan
 * "cod_ipress" (ej. BASE_INICIO_IMPL). La union es por cod_ipress; si la hoja
 * secundaria trae "periodo_adi", se prefiere la fila cuyo periodo_adi coincide
 * con el periodo de la hoja principal. Los valores de la hoja principal tienen
 * prioridad: la secundaria solo rellena columnas vacias o que no existen.
 * Reemplaza por completo los datos existentes (import full-refresh, no incremental).
 */
export async function importExcelBuffer(buffer: Buffer): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheets = workbook.worksheets.map(readSheet);
  const candidates = sheets.filter((s) => s.columns.includes("ipress") && s.columns.includes("periodo"));
  const primary = candidates.find((s) => s.name.trim().toUpperCase() === "BASE") ?? candidates[0];

  if (!primary) {
    throw new Error(
      'No se encontro una hoja con columnas "ipress" y "periodo". Revisa el archivo o los alias en lib/modules.ts.'
    );
  }

  const secondaries = sheets.filter((s) => s !== primary && s.records.some((r) => r.cod_ipress));
  const lookups = secondaries.map((sheet) => {
    const byCod = new Map<string, SheetRecord[]>();
    for (const r of sheet.records) {
      if (!r.cod_ipress) continue;
      const key = String(r.cod_ipress);
      if (!byCod.has(key)) byCod.set(key, []);
      byCod.get(key)!.push(r);
    }
    return { sheet, byCod };
  });

  const rows: SheetRecord[] = [];
  for (const base of primary.records) {
    if (!base.ipress || !base.periodo) continue;
    const record: SheetRecord = { ...base };
    for (const { sheet, byCod } of lookups) {
      const matches = record.cod_ipress ? byCod.get(String(record.cod_ipress)) : undefined;
      if (!matches?.length) continue;
      const match =
        matches.find((m) => String(m.periodo_adi ?? "").trim() === String(base.periodo).trim()) ?? matches[0];
      const prefix = sheet.name.trim().toLowerCase();
      for (const [k, v] of Object.entries(match)) {
        // nom_mes describe el periodo de la hoja secundaria, no el de la principal.
        if (k !== "nom_mes" && isEmpty(record[k])) record[k] = v;
        // Guardamos el periodo de la hoja secundaria (ej. inicio de implementacion) aparte.
        if (k === "periodo") record[`${prefix}_periodo`] = v;
      }
    }
    rows.push(record);
  }

  const knownColumns = new Set<string>([...DIMENSION_COLUMNS, ...MODULE_KEYS]);
  const unmapped = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) if (!knownColumns.has(k)) unmapped.add(k);

  const db = getDb();
  const insertCols = [...DIMENSION_COLUMNS, ...MODULE_KEYS, "extra_json"];
  const placeholders = insertCols.map(() => "?").join(", ");
  const insertStmt = db.prepare(
    `INSERT INTO ipress_module_status (${insertCols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`
  );

  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM ipress_module_status");
    for (const record of rows) {
      const extra: Record<string, string | number | null> = {};
      for (const [k, v] of Object.entries(record)) {
        if (!knownColumns.has(k)) extra[k] = v;
      }
      const values = [
        ...DIMENSION_COLUMNS.map((c) => (record[c] == null ? null : String(record[c]).trim())),
        ...MODULE_KEYS.map((c) => {
          const v = record[c];
          if (v === null || v === undefined || v === "") return null;
          return Number(v) ? 1 : 0;
        }),
        Object.keys(extra).length ? JSON.stringify(extra) : null,
      ];
      insertStmt.run(...(values as (string | number | null)[]));
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  setConfig("last_import_at", new Date().toISOString());
  const sheetUsed = [primary.name, ...secondaries.map((s) => s.name)].join(" + ");
  setConfig("last_import_sheet", sheetUsed);

  return {
    sheetUsed,
    rowsImported: rows.length,
    unmappedColumns: Array.from(unmapped),
  };
}
