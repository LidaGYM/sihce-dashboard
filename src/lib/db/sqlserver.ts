import sql from "mssql";

let pool: sql.ConnectionPool | null = null;

function getConfig(): sql.config {
  return {
    server: process.env.MSSQL_HOST || "localhost",
    port: Number(process.env.MSSQL_PORT || 1433),
    database: process.env.MSSQL_DATABASE,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    // La vista puede tardar (lee HIS MINSA completo); el valor por defecto de mssql es 15 s.
    requestTimeout: Number(process.env.MSSQL_REQUEST_TIMEOUT_MS || 120000),
    options: {
      encrypt: (process.env.MSSQL_ENCRYPT ?? "true") === "true",
      trustServerCertificate: (process.env.MSSQL_TRUST_SERVER_CERT ?? "true") === "true",
    },
  };
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;
  pool = await new sql.ConnectionPool(getConfig()).connect();
  return pool;
}

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const p = await getPool();
    await p.request().query("SELECT 1 AS ok");
    return { ok: true, message: "Conexion exitosa a SQL Server." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, message };
  }
}

export function getSourceTable(): string {
  // Debe ser una tabla o vista con las mismas columnas que ipress_module_status
  // (ver sql/create_view_example.sql). Se valida contra un allowlist simple para
  // evitar inyeccion via variable de entorno mal configurada.
  const table = process.env.MSSQL_TABLE || "dbo.vw_sihce_modulos_ipress";
  if (!/^[a-zA-Z0-9_.]+$/.test(table)) {
    throw new Error("MSSQL_TABLE contiene caracteres no permitidos");
  }
  return table;
}

export async function querySqlServer<T = Record<string, unknown>>(
  queryText: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const p = await getPool();
  const request = p.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value as never);
  }
  const result = await request.query<T>(queryText);
  return result.recordset;
}
