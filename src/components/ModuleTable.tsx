"use client";

import { useMemo, useState } from "react";
import { ModuleDef } from "@/lib/modules";
import { SectionDef } from "@/lib/sections";
import { SummaryRow } from "@/lib/types";

interface Props {
  rows: SummaryRow[];
  grandTotal: SummaryRow;
  section: SectionDef;
}

const numCell = "px-2 py-1 text-right tabular-nums";

function sortRows(rows: SummaryRow[], order: SectionDef["order"]): SummaryRow[] {
  const byName = (a: SummaryRow, b: SummaryRow) => a.label.localeCompare(b.label);
  const provCmp = order === "totales" ? (a: SummaryRow, b: SummaryRow) => b.totalIpress - a.totalIpress || byName(a, b) : byName;
  const childCmp = order === "totales" ? (a: SummaryRow, b: SummaryRow) => b.totalModulos - a.totalModulos || byName(a, b) : byName;
  return [...rows].sort(provCmp).map((r) => ({ ...r, children: r.children ? [...r.children].sort(childCmp) : undefined }));
}

export default function ModuleTable({ rows, grandTotal, section }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const columns = useMemo(() => section.groups.flatMap((g) => g.modules), [section]);
  const sorted = useMemo(() => sortRows(rows, section.order), [rows, section.order]);
  const showTotal = section.showTotalModulos;

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Tablas angostas (secciones) no se estiran a todo el ancho, como en el Power BI.
  const width = columns.length > 8 ? "w-full min-w-[1150px]" : "w-auto";

  return (
    <div className="overflow-x-auto">
      <table className={`${width} table-fixed border-separate border-spacing-0 text-sm`}>
        <colgroup>
          <col className="w-80" />
          {Array.from({ length: columns.length + (showTotal ? 2 : 1) }, (_, i) => (
            <col key={i} className={columns.length > 8 ? "" : "w-20"} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th colSpan={2} />
            {section.groups.map((g, i) => (
              <th
                key={g.title}
                colSpan={g.modules.length + (showTotal && i === section.groups.length - 1 ? 1 : 0)}
                className="px-1 pb-2"
              >
                <div className="rounded-md border border-gray-500 bg-gray-200 py-2 text-xs font-semibold">{g.title}</div>
              </th>
            ))}
          </tr>
          <tr className="text-[11px] font-normal leading-tight">
            <th className="sticky left-0 z-10 border-y-2 border-l-2 border-sihce-navy bg-white px-3 py-2 text-center font-normal">
              Provincia / Ipress
            </th>
            <HeaderCell label="Total Ipress" />
            {columns.map((c, i) => (
              <HeaderCell key={c.key} label={c.label} last={!showTotal && i === columns.length - 1} />
            ))}
            {showTotal && <HeaderCell label="Modulos SIHCE" last />}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <RowGroup
              key={row.key}
              row={row}
              columns={columns}
              showTotal={showTotal}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
          <tr className="font-bold">
            <td className="sticky left-0 border-r border-gray-400 bg-white px-3 py-1.5">Total</td>
            <Cells row={grandTotal} columns={columns} showTotal={showTotal} />
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

function Cells({ row, columns, showTotal }: { row: SummaryRow; columns: ModuleDef[]; showTotal: boolean }) {
  return (
    <>
      <td className={numCell}>{row.totalIpress}</td>
      {columns.map((c) => (
        <td key={c.key} className={numCell}>
          {row.totals[c.key] ?? 0}
        </td>
      ))}
      {showTotal && <td className={numCell}>{row.totalModulos}</td>}
    </>
  );
}

function RowGroup({
  row,
  columns,
  showTotal,
  expanded,
  toggle,
}: {
  row: SummaryRow;
  columns: ModuleDef[];
  showTotal: boolean;
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
        <Cells row={row} columns={columns} showTotal={showTotal} />
      </tr>
      {isOpen &&
        row.children?.map((child) => (
          <tr key={child.key} className="odd:bg-white even:bg-gray-100">
            <td className="sticky left-0 border-r border-gray-400 bg-inherit py-1 pl-9 pr-3">{child.label}</td>
            <Cells row={child} columns={columns} showTotal={showTotal} />
          </tr>
        ))}
    </>
  );
}
