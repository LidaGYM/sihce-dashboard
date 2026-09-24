"use client";

import { useState } from "react";
import { ModuleDef, modulesByGroup } from "@/lib/modules";
import { SummaryRow } from "@/lib/types";

interface Props {
  rows: SummaryRow[];
  grandTotal: SummaryRow;
}

const ADMIN = modulesByGroup("administrativo");
const ASIST = modulesByGroup("asistencial");
const COLUMNS = [...ADMIN, ...ASIST];

const numCell = "px-2 py-1 text-right tabular-nums";

export default function ModuleTable({ rows, grandTotal }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px] table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col className="w-52" />
          {Array.from({ length: COLUMNS.length + 2 }, (_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th colSpan={2} />
            <th colSpan={ADMIN.length} className="px-1 pb-2">
              <div className="rounded-md border border-gray-500 bg-gray-200 py-2 text-xs font-semibold">
                Modulos Administrativo
              </div>
            </th>
            <th colSpan={ASIST.length + 1} className="px-1 pb-2">
              <div className="rounded-md border border-gray-500 bg-gray-200 py-2 text-xs font-semibold">
                Modulos Asistenciales
              </div>
            </th>
          </tr>
          <tr className="text-[11px] font-normal leading-tight">
            <th className="sticky left-0 z-10 w-56 border-y-2 border-l-2 border-sihce-navy bg-white px-3 py-2 text-center font-normal">
              Provincia / Ipress
            </th>
            <HeaderCell label="Total Ipress" />
            {COLUMNS.map((c) => (
              <HeaderCell key={c.key} label={c.label} />
            ))}
            <HeaderCell label="Modulos SIHCE" last />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RowGroup key={row.key} row={row} expanded={expanded} toggle={toggle} />
          ))}
          <tr className="font-bold">
            <td className="sticky left-0 border-r border-gray-400 bg-white px-3 py-1.5">Total</td>
            <Cells row={grandTotal} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function HeaderCell({ label, last }: { label: string; last?: boolean }) {
  return (
    <th
      className={`break-words border-y-2 border-l border-sihce-navy px-1 py-2 text-center font-normal ${
        last ? "border-r-2" : ""
      }`}
    >
      {label}
    </th>
  );
}

function Cells({ row, columns = COLUMNS }: { row: SummaryRow; columns?: ModuleDef[] }) {
  return (
    <>
      <td className={numCell}>{row.totalIpress}</td>
      {columns.map((c) => (
        <td key={c.key} className={numCell}>
          {row.totals[c.key] ?? 0}
        </td>
      ))}
      <td className={numCell}>{row.totalModulos}</td>
    </>
  );
}

function RowGroup({
  row,
  expanded,
  toggle,
}: {
  row: SummaryRow;
  expanded: Set<string>;
  toggle: (key: string) => void;
}) {
  const isOpen = expanded.has(row.key);
  const hasChildren = !!row.children?.length;

  return (
    <>
      <tr
        className={`font-bold odd:bg-white even:bg-gray-100 ${hasChildren ? "cursor-pointer hover:bg-blue-50" : ""}`}
        onClick={() => hasChildren && toggle(row.key)}
      >
        <td className="sticky left-0 border-r border-gray-400 bg-inherit px-3 py-1">
          {hasChildren && (
            <span className="mr-2 inline-flex h-3 w-3 items-center justify-center border border-gray-500 text-[9px] leading-none text-gray-600">
              {isOpen ? "−" : "+"}
            </span>
          )}
          {row.label}
        </td>
        <Cells row={row} />
      </tr>
      {isOpen &&
        row.children?.map((child) => (
          <tr key={child.key} className="odd:bg-white even:bg-gray-100">
            <td className="sticky left-0 border-r border-gray-400 bg-inherit py-1 pl-9 pr-3">{child.label}</td>
            <Cells row={child} />
          </tr>
        ))}
    </>
  );
}
