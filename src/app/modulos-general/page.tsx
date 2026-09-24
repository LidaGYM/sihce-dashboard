"use client";

import { useEffect, useState } from "react";
import BrandLayout from "@/components/BrandLayout";
import FilterBar from "@/components/FilterBar";
import ModuleTable from "@/components/ModuleTable";
import { FiltersResponse, SummaryResponse } from "@/lib/types";

export default function ModulosGeneral() {
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [periodo, setPeriodo] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [ipress, setIpress] = useState("Todas");
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
    <BrandLayout subtitle="Detalle de Modulos SIHCE Implementados" backHref="/">
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

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {filters && !filters.periodos.length && !error && (
        <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
          No hay datos cargados. Sube un Excel desde Configuracion / Cargar datos.
        </div>
      )}

      {loading && !error && <div className="p-4 text-sm text-gray-500">Cargando datos...</div>}

      {!loading && !error && summary && <ModuleTable rows={summary.rows} grandTotal={summary.grandTotal} />}

      {summary && (
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <FooterBox label="Fuente de datos">
            {summary.source === "sqlserver" ? "BD SQL Server" : "BD HIS-MINSA / BD SIHCE"}
          </FooterBox>
          <FooterBox label="Fecha de actualización">
            {summary.updatedAt
              ? new Date(summary.updatedAt).toLocaleDateString("es-PE", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "N/D"}
          </FooterBox>
        </div>
      )}
    </BrandLayout>
  );
}

function FooterBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[320px] flex-1 overflow-hidden rounded-sm border-2 border-sihce-navy">
      <div className="bg-sihce-navy px-3 py-1.5 uppercase text-white">{label}</div>
      <div className="flex flex-1 items-center justify-center px-3">{children}</div>
    </div>
  );
}
