"use client";

import { FiltersResponse } from "@/lib/types";

interface Props {
  filters: FiltersResponse | null;
  periodo: string;
  categoria: string;
  ipress: string;
  onChange: (next: { periodo?: string; categoria?: string; ipress?: string }) => void;
}

function FilterBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-40 overflow-hidden rounded-md border-2 border-sihce-navy sm:w-44">
      <div className="bg-sihce-navy px-2 py-1.5 text-center text-xs font-semibold text-white">{label}</div>
      <div className="p-3">{children}</div>
    </div>
  );
}

const selectClass = "w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-600";

export default function FilterBar({ filters, periodo, categoria, ipress, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      <FilterBox label="Ipress calificadas">
        <select className={selectClass} value={ipress} onChange={(e) => onChange({ ipress: e.target.value })}>
          <option value="Todas">Todas</option>
          {filters?.ipressList.map((i) => (
            <option key={i.cod_ipress} value={i.cod_ipress}>
              {i.ipress}
            </option>
          ))}
        </select>
      </FilterBox>

      <FilterBox label="Periodo">
        <select className={selectClass} value={periodo} onChange={(e) => onChange({ periodo: e.target.value })}>
          {filters?.periodos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </FilterBox>

      <FilterBox label="Categoria">
        <select className={selectClass} value={categoria} onChange={(e) => onChange({ categoria: e.target.value })}>
          <option value="Todas">Todas</option>
          {filters?.categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FilterBox>
    </div>
  );
}
