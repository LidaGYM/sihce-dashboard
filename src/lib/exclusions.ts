// Establecimientos (codigo unico / cod_ipress) que no se muestran en ninguna vista del dashboard.
export const EXCLUDED_COD_IPRESS = [
  "30478",
  "27197",
  "25933",
  "27199",
  "3414",
  "25977",
  "28653",
  "33478",
  "34021",
  "38021",
];

// Condicion SQL (valida en SQLite y SQL Server). Las filas sin cod_ipress se mantienen.
export const EXCLUDED_IPRESS_SQL = `(cod_ipress IS NULL OR cod_ipress NOT IN (${EXCLUDED_COD_IPRESS.map(
  (c) => `'${c}'`
).join(", ")}))`;
