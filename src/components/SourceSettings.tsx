"use client";

import { useEffect, useState } from "react";
import { DataSourceMode } from "@/lib/types";

export default function SourceSettings() {
  const [mode, setMode] = useState<DataSourceMode>("excel");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/data-source")
      .then((r) => r.json())
      .then((data) => setMode(data.mode));
  }, []);

  const changeMode = async (next: DataSourceMode) => {
    setMode(next);
    await fetch("/api/data-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: next }),
    });
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-connection", { method: "POST" });
      const data = await res.json();
      setTestResult(data.message);
    } catch {
      setTestResult("No se pudo probar la conexion.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Fuente de datos</h2>
      <div className="mb-3 flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "excel"}
            onChange={() => changeMode("excel")}
          />
          Excel cargado manualmente
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "sqlserver"}
            onChange={() => changeMode("sqlserver")}
          />
          Conexion a SQL Server
        </label>
      </div>

      {mode === "sqlserver" && (
        <div className="rounded bg-gray-50 p-3 text-xs text-gray-600">
          <p className="mb-2">
            La conexion se configura por variables de entorno (MSSQL_HOST, MSSQL_DATABASE, MSSQL_USER,
            MSSQL_PASSWORD, MSSQL_TABLE). Revisa <code>.env.example</code> y{" "}
            <code>sql/create_view_example.sql</code>.
          </p>
          <button
            onClick={testConnection}
            disabled={testing}
            className="rounded bg-sihce-header px-3 py-1 text-white disabled:opacity-50"
          >
            {testing ? "Probando..." : "Probar conexion"}
          </button>
          {testResult && <p className="mt-2">{testResult}</p>}
        </div>
      )}
    </div>
  );
}
