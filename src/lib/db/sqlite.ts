import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { MODULE_KEYS } from "../modules";

let db: DatabaseSync | null = null;

function moduleColumnsSql(): string {
  return MODULE_KEYS.map((k) => `"${k}" INTEGER`).join(",\n    ");
}

export function getDb(): DatabaseSync {
  if (db) return db;

  const sqlitePath = process.env.SQLITE_PATH || "./data/app.sqlite";
  const resolved = path.resolve(process.cwd(), sqlitePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });

  db = new DatabaseSync(resolved);
  db.exec("PRAGMA journal_mode = WAL;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS ipress_module_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      periodo TEXT NOT NULL,
      nom_mes TEXT,
      departamento TEXT,
      disa TEXT,
      provincia TEXT NOT NULL,
      distrito TEXT,
      categoria TEXT,
      tipo_eess TEXT,
      cod_ipress TEXT,
      ipress TEXT NOT NULL,
      ${moduleColumnsSql()},
      extra_json TEXT,
      imported_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_ipress_periodo ON ipress_module_status(periodo);
    CREATE INDEX IF NOT EXISTS idx_ipress_categoria ON ipress_module_status(categoria);
    CREATE INDEX IF NOT EXISTS idx_ipress_cod_ipress ON ipress_module_status(cod_ipress);

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  return db;
}

export function getConfig(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM app_config WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setConfig(key: string, value: string): void {
  getDb()
    .prepare(
      "INSERT INTO app_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}
