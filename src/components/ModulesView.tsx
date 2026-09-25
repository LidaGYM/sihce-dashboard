"use client";

import { useEffect, useMemo, useState } from "react";
import BrandLayout from "./BrandLayout";
import FilterBar from "./FilterBar";
import ModuleTable from "./ModuleTable";
import { SectionDef } from "@/lib/sections";
import { FiltersResponse, SummaryResponse, SummaryRow } from "@/lib/types";

export default function ModulesView({ section }: { section: SectionDef }) {
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [periodo, setPeriodo] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [calificadas, setCalificadas] = useState("Todas");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then((data: FiltersResponse) => {
        setFilters(data);
        if (data.periodos.length && !periodo) setPeriodo(defaultPeriodo(data.periodos));
      })
      .catch(() => setError("No se pudieron cargar los filtros."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!periodo) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ periodo, categoria });
    fetch(`/api/modules-summary?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSummary(data);
      })
      .catch((err) => setError(err.message ?? "Error al cargar los datos"))
      .finally(() => setLoading(false));
  }, [periodo, categoria]);

  const calificadasOptions = useMemo(() => {
    const set = new Set<number>();
    for (const p of summary?.rows ?? []) for (const c of p.children ?? []) set.add(c.totalModulos);
    return Array.from(set).sort((a, b) => b - a);
  }, [summary]);

  const view = useMemo(
    () => (summary ? filterByTotalModulos(summary, calificadas) : null),
    [summary, calificadas]
  );

  return (
    <BrandLayout
      subtitle="Detalle de Modulos SIHCE Implementados"
      backHref="/"
      footer={
        summary && (
          <div className="flex flex-wrap gap-4 text-xs">
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
        )
      }
    >
      <div className="mb-4">
        <FilterBar
          filters={filters}
          periodo={periodo}
          categoria={categoria}
          calificadas={calificadas}
          calificadasOptions={calificadasOptions}
          showCalificadas={section.showCalificadasFilter}
          onChange={(next) => {
            if (next.periodo !== undefined) setPeriodo(next.periodo);
            if (next.categoria !== undefined) setCategoria(next.categoria);
            if (next.calificadas !== undefined) setCalificadas(next.calificadas);
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

      {!loading && !error && view && <ModuleTable rows={view.rows} grandTotal={view.grandTotal} section={section} />}

    </BrandLayout>
  );
}

function FooterBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[260px] flex-1 overflow-hidden rounded-sm border border-sihce-navy">
      <div className="bg-sihce-navy px-2.5 py-1 uppercase leading-tight text-white">{label}</div>
      <div className="flex flex-1 items-center justify-center px-2.5 leading-tight">{children}</div>
    </div>
  );
}

function addRows(label: string, key: string, rows: SummaryRow[]): SummaryRow {
  const totals: Record<string, number> = {};
  for (const r of rows) for (const [k, v] of Object.entries(r.totals)) totals[k] = (totals[k] ?? 0) + v;
  return {
    key,
    label,
    totalIpress: rows.reduce((a, r) => a + r.totalIpress, 0),
    totals,
    totalModulos: rows.reduce((a, r) => a + r.totalModulos, 0),
  };
}

// Deja solo las IPRESS cuyo total de modulos es el elegido y recalcula provincias y total.
function filterByTotalModulos(summary: SummaryResponse, value: string) {
  if (value === "Todas") return { rows: summary.rows, grandTotal: summary.grandTotal };
  const target = Number(value);
  const rows: SummaryRow[] = summary.rows
    .map((p): SummaryRow | null => {
      const children = (p.children ?? []).filter((c) => c.totalModulos === target);
      return children.length ? { ...addRows(p.label, p.key, children), children } : null;
    })
    .filter((p): p is SummaryRow => p !== null);
  return { rows, grandTotal: addRows("Total", "TOTAL", rows) };
}

// Periodo inicial: el mes anterior al actual (YYYYMM) si tiene datos; si no, el ultimo con datos.
function defaultPeriodo(periodos: string[]): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = `${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, "0")}`;
  if (periodos.includes(prevKey)) return prevKey;
  return periodos.reduce((max, p) => (Number(p) > Number(max) ? p : max), periodos[0]);
}
