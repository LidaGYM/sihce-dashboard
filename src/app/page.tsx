"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import Tabs from "@/components/Tabs";
import ModuleTable from "@/components/ModuleTable";
import { ModuleGroup } from "@/lib/modules";
import { FiltersResponse, SummaryResponse } from "@/lib/types";

export default function Home() {
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [periodo, setPeriodo] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [ipress, setIpress] = useState("Todas");
  const [group, setGroup] = useState<ModuleGroup>("administrativo");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then((data: FiltersResponse) => {
        setFilters(data);
        if (data.periodos.length && !periodo) setPeriodo(data.periodos[0]);
      })
      .catch(() => setError("No se pudieron cargar los filtros."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!periodo) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ periodo, categoria, ipress });
    fetch(`/api/modules-summary?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSummary(data);
      })
      .catch((err) => setError(err.message ?? "Error al cargar los datos"))
      .finally(() => setLoading(false));
  }, [periodo, categoria, ipress]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between rounded-md bg-sihce-header px-6 py-4 text-white shadow">
        <div>
          <h1 className="text-lg font-bold">SIHCE - MODULOS IMPLEMENTADOS</h1>
          <p className="text-sm opacity-90">Detalle de modulos SIHCE implementados por IPRESS</p>
        </div>
        <Link
          href="/settings"
          className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          Configuracion / Cargar datos
        </Link>
      </div>

      <div className="mb-4">
        <FilterBar
          filters={filters}
          periodo={periodo}
          categoria={categoria}
          ipress={ipress}
          onChange={(next) => {
            if (next.periodo !== undefined) setPeriodo(next.periodo);
            if (next.categoria !== undefined) setCategoria(next.categoria);
            if (next.ipress !== undefined) setIpress(next.ipress);
          }}
        />
      </div>

      <div className="mb-0">
        <Tabs active={group} onChange={setGroup} />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading && !error && (
        <div className="rounded-md bg-white p-4 text-sm text-gray-500">Cargando datos...</div>
      )}

      {!loading && !error && summary && (
        <ModuleTable rows={summary.rows} grandTotal={summary.grandTotal} group={group} />
      )}

      {!loading && !error && summary && (
        <div className="mt-4 flex flex-wrap gap-4 rounded-md bg-white p-3 text-xs text-gray-500 shadow-sm">
          <span>
            <strong>Fuente de datos:</strong>{" "}
            {summary.source === "sqlserver" ? "BD SQL Server" : "Excel cargado"}
          </span>
          <span>
            <strong>Fecha de actualizacion:</strong>{" "}
            {summary.updatedAt ? new Date(summary.updatedAt).toLocaleString("es-PE") : "N/D"}
          </span>
        </div>
      )}
    </main>
  );
}
