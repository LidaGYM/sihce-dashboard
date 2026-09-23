"use client";

import { FiltersResponse } from "@/lib/types";

interface Props {
  filters: FiltersResponse | null;
  periodo: string;
  categoria: string;
  ipress: string;
  onChange: (next: { periodo?: string; categoria?: string; ipress?: string }) => void;
}

export default function FilterBar({ filters, periodo, categoria, ipress, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-4 rounded-md bg-white p-4 shadow-sm">
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-semibold text-gray-500">Ipress calificadas</label>
        <select
          className="min-w-[220px] rounded border border-gray-300 px-2 py-1 text-sm"
          value={ipress}
          onChange={(e) => onChange({ ipress: e.target.value })}
        >
          <option value="Todas">Todas</option>
          {filters?.ipressList.map((i) => (
            <option key={i.cod_ipress} value={i.cod_ipress}>
              {i.ipress}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs font-semibold text-gray-500">Periodo</label>
        <select
          className="min-w-[140px] rounded border border-gray-300 px-2 py-1 text-sm"
          value={periodo}
          onChange={(e) => onChange({ periodo: e.target.value })}
        >
          {filters?.periodos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs font-semibold text-gray-500">Categoria</label>
        <select
          className="min-w-[140px] rounded border border-gray-300 px-2 py-1 text-sm"
          value={categoria}
          onChange={(e) => onChange({ categoria: e.target.value })}
        >
          <option value="Todas">Todas</option>
          {filters?.categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
