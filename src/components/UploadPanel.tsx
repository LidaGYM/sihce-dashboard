"use client";

import { useRef, useState } from "react";

export default function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setStatus("Selecciona un archivo .xlsx primero.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar el archivo");
      setStatus(
        `Importadas ${data.rowsImported} filas desde la hoja "${data.sheetUsed}".` +
          (data.unmappedColumns?.length
            ? ` Columnas no mapeadas (guardadas sin sumar): ${data.unmappedColumns.join(", ")}`
            : "")
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Cargar Excel</h2>
      <p className="mb-3 text-xs text-gray-500">
        El archivo debe tener una hoja con columnas de dimension (ipress, periodo, provincia, categoria, ...)
        y columnas de modulo (mod_gestion, mod_citas, mod_triaje, ...). Cada carga reemplaza los datos
        anteriores.
      </p>
      <div className="flex items-center gap-3">
        <input ref={inputRef} type="file" accept=".xlsx" className="text-sm" />
        <button
          onClick={handleUpload}
          disabled={busy}
          className="rounded bg-sihce-header px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Cargando..." : "Cargar"}
        </button>
      </div>
      {status && <p className="mt-3 text-xs text-gray-600">{status}</p>}
    </div>
  );
}
