import { getDb } from "../db/sqlite";
import { getSourceTable, querySqlServer } from "../db/sqlserver";
import { EXCLUDED_IPRESS_SQL } from "../exclusions";
import { MODULE_KEYS } from "../modules";
import { getDataSourceMode, getLastImportAt } from "./config";
import { FiltersResponse, SummaryFilters, SummaryResponse, SummaryRow } from "../types";

function emptyTotals(): Record<string, number> {
  const t: Record<string, number> = {};
  for (const k of MODULE_KEYS) t[k] = 0;
  return t;
}

function sumTotals(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = emptyTotals();
  for (const k of MODULE_KEYS) out[k] = (a[k] ?? 0) + (b[k] ?? 0);
  return out;
}

function totalModulos(totals: Record<string, number>): number {
  return MODULE_KEYS.reduce((acc, k) => acc + (totals[k] ?? 0), 0);
}

interface RawRow {
  provincia: string;
  ipress: string;
  cod_ipress: string | null;
  [key: string]: unknown;
}

function buildWhere(filters: SummaryFilters) {
  const clauses: string[] = ["periodo = @periodo", EXCLUDED_IPRESS_SQL.sqlserver];
  const params: Record<string, unknown> = { periodo: filters.periodo };
  if (filters.categoria && filters.categoria !== "Todas") {
    clauses.push("categoria = @categoria");
    params.categoria = filters.categoria;
  }
  if (filters.ipress && filters.ipress !== "Todas") {
    clauses.push("cod_ipress = @ipress");
    params.ipress = filters.ipress;
  }
  return { where: clauses.join(" AND "), params };
}

async function fetchRowsSqlite(filters: SummaryFilters): Promise<RawRow[]> {
  const db = getDb();
  const clauses: string[] = ["periodo = ?", EXCLUDED_IPRESS_SQL.sqlite];
  const params: (string | number)[] = [filters.periodo];
  if (filters.categoria && filters.categoria !== "Todas") {
    clauses.push("categoria = ?");
    params.push(filters.categoria);
  }
  if (filters.ipress && filters.ipress !== "Todas") {
    clauses.push("cod_ipress = ?");
    params.push(filters.ipress);
  }
  const cols = ["provincia", "ipress", "cod_ipress", ...MODULE_KEYS];
  const sql = `SELECT ${cols.map((c) => `"${c}"`).join(", ")} FROM ipress_module_status WHERE ${clauses.join(" AND ")}`;
  return db.prepare(sql).all(...params) as RawRow[];
}

async function fetchRowsSqlServer(filters: SummaryFilters): Promise<RawRow[]> {
  const { where, params } = buildWhere(filters);
  const table = getSourceTable();
  const cols = ["provincia", "ipress", "cod_ipress", ...MODULE_KEYS];
  const queryText = `SELECT ${cols.map((c) => `[${c}]`).join(", ")} FROM ${table} WHERE ${where}`;
  return querySqlServer<RawRow>(queryText, params);
}

function rowToTotals(row: RawRow): Record<string, number> {
  const totals = emptyTotals();
  for (const k of MODULE_KEYS) {
    const v = row[k];
    totals[k] = v ? Number(v) : 0;
  }
  return totals;
}

function buildSummaryRows(rows: RawRow[]): { rows: SummaryRow[]; grandTotal: SummaryRow } {
  const byProvincia = new Map<string, RawRow[]>();
  for (const row of rows) {
    const key = row.provincia || "SIN PROVINCIA";
    if (!byProvincia.has(key)) byProvincia.set(key, []);
    byProvincia.get(key)!.push(row);
  }

  const provinciaRows: SummaryRow[] = [];
  let grandTotals = emptyTotals();
  let grandCount = 0;

  for (const [provincia, provRows] of Array.from(byProvincia.entries())) {
    let provTotals = emptyTotals();
    const children: SummaryRow[] = provRows
      .map((row) => {
        const totals = rowToTotals(row);
        provTotals = sumTotals(provTotals, totals);
        return {
          key: row.cod_ipress ?? row.ipress,
          label: row.ipress,
          totalIpress: 1,
          totals,
          totalModulos: totalModulos(totals),
        };
      });

    grandTotals = sumTotals(grandTotals, provTotals);
    grandCount += provRows.length;

    provinciaRows.push({
      key: provincia,
      label: provincia,
      totalIpress: provRows.length,
      totals: provTotals,
      totalModulos: totalModulos(provTotals),
      children,
    });
  }

  const grandTotal: SummaryRow = {
    key: "TOTAL",
    label: "Total",
    totalIpress: grandCount,
    totals: grandTotals,
    totalModulos: totalModulos(grandTotals),
  };

  return { rows: provinciaRows, grandTotal };
}

export async function getModulesSummary(filters: SummaryFilters): Promise<SummaryResponse> {
  const mode = getDataSourceMode();
  const rawRows = mode === "sqlserver" ? await fetchRowsSqlServer(filters) : await fetchRowsSqlite(filters);
  const { rows, grandTotal } = buildSummaryRows(rawRows);

  return {
    periodo: filters.periodo,
    rows,
    grandTotal,
    source: mode,
    updatedAt: mode === "excel" ? getLastImportAt() : new Date().toISOString(),
  };
}

export async function getFilters(): Promise<FiltersResponse> {
  const mode = getDataSourceMode();

  if (mode === "sqlserver") {
    const table = getSourceTable();
    const periodos = await querySqlServer<{ periodo: string }>(
      `SELECT DISTINCT periodo FROM ${table} ORDER BY periodo DESC`
    );
    const categorias = await querySqlServer<{ categoria: string }>(
      `SELECT DISTINCT categoria FROM ${table} WHERE categoria IS NOT NULL ORDER BY categoria`
    );
    const ipressList = await querySqlServer<{ cod_ipress: string; ipress: string }>(
      `SELECT DISTINCT cod_ipress, ipress FROM ${table} WHERE ${EXCLUDED_IPRESS_SQL.sqlserver} ORDER BY ipress`
    );
    // En la vista, periodo es INT: se normaliza a texto ("202608") como en el modo Excel.
    return {
      periodos: periodos.map((p) => String(p.periodo)),
      categorias: categorias.map((c) => c.categoria),
      ipressList: ipressList.map((i) => ({ cod_ipress: String(i.cod_ipress), ipress: i.ipress })),
    };
  }

  const db = getDb();
  const periodos = db
    .prepare("SELECT DISTINCT periodo FROM ipress_module_status ORDER BY periodo DESC")
    .all() as { periodo: string }[];
  const categorias = db
    .prepare(
      "SELECT DISTINCT categoria FROM ipress_module_status WHERE categoria IS NOT NULL ORDER BY categoria"
    )
    .all() as { categoria: string }[];
  const ipressList = db
    .prepare(`SELECT DISTINCT cod_ipress, ipress FROM ipress_module_status WHERE ${EXCLUDED_IPRESS_SQL.sqlite} ORDER BY ipress`)
    .all() as { cod_ipress: string; ipress: string }[];

  return {
    periodos: periodos.map((p) => p.periodo),
    categorias: categorias.map((c) => c.categoria),
    ipressList,
  };
}
