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

const excludedList = EXCLUDED_COD_IPRESS.join(", ");

// Condiciones SQL por motor. Se compara el codigo como numero para que no importe
// si viene como INT, como texto o con ceros a la izquierda ("00030478").
// Las filas sin cod_ipress se mantienen.
export const EXCLUDED_IPRESS_SQL = {
  sqlite: `(cod_ipress IS NULL OR CAST(cod_ipress AS INTEGER) NOT IN (${excludedList}))`,
  sqlserver: `(cod_ipress IS NULL OR TRY_CAST(cod_ipress AS BIGINT) IS NULL OR TRY_CAST(cod_ipress AS BIGINT) NOT IN (${excludedList}))`,
};
