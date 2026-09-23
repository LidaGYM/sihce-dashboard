import { getConfig, setConfig } from "../db/sqlite";
import { DataSourceMode } from "../types";

export function getDataSourceMode(): DataSourceMode {
  const mode = getConfig("data_source_mode");
  return mode === "sqlserver" ? "sqlserver" : "excel";
}

export function setDataSourceMode(mode: DataSourceMode): void {
  setConfig("data_source_mode", mode);
}

export function getLastImportAt(): string | null {
  return getConfig("last_import_at");
}
