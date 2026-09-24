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

/**
 * Importa la primera hoja que contenga al menos las columnas "ipress" y "periodo".
 * Reemplaza por completo los datos existentes (import full-refresh, no incremental).
 */
export async function importExcelBuffer(buffer: Buffer): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  let targetSheet: ExcelJS.Worksheet | null = null;
  let headerMap: Map<number, string> = new Map();

  for (const sheet of workbook.worksheets) {
    const headerRow = sheet.getRow(1);
    const map = new Map<number, string>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const raw = normalizeHeader(cellToPrimitive(cell.value)?.toString() ?? "");
      const canonical = EXCEL_HEADER_ALIASES[raw] ?? raw;
      map.set(colNumber, canonical);
    });
    const values = Array.from(map.values());
    if (values.includes("ipress") && values.includes("periodo")) {
      targetSheet = sheet;
      headerMap = map;
      break;
    }
  }

  if (!targetSheet) {
    throw new Error(
      'No se encontro una hoja con columnas "ipress" y "periodo". Revisa el archivo o los alias en lib/modules.ts.'
    );
  }

  const knownColumns = new Set<string>([...DIMENSION_COLUMNS, ...MODULE_KEYS]);
  const unmapped = new Set<string>();

  const rows: Record<string, string | number | null>[] = [];
  targetSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const record: Record<string, string | number | null> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headerMap.get(colNumber);
      if (!key) return;
      record[key] = cellToPrimitive(cell.value);
      if (!knownColumns.has(key)) unmapped.add(key);
    });
    if (record.ipress && record.periodo) rows.push(record);
  });

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
  setConfig("last_import_sheet", targetSheet.name);

  return {
    sheetUsed: targetSheet.name,
    rowsImported: rows.length,
    unmappedColumns: Array.from(unmapped),
  };
}
