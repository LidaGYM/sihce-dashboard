"use client";

import { useState } from "react";
import { ModuleGroup, modulesByGroup } from "@/lib/modules";
import { SummaryRow } from "@/lib/types";

interface Props {
  rows: SummaryRow[];
  grandTotal: SummaryRow;
  group: ModuleGroup;
}

export default function ModuleTable({ rows, grandTotal, group }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const columns = modulesByGroup(group);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto rounded-md bg-white shadow-sm">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="bg-sihce-header text-white">
            <th className="sticky left-0 z-10 bg-sihce-header px-3 py-2 text-left">Provincia / Ipress</th>
            <th className="px-3 py-2 text-right">Total Ipress</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-right">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-2 text-right">Modulos SIHCE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RowGroup key={row.key} row={row} columns={columns} expanded={expanded} toggle={toggle} />
          ))}
          <tr className="border-t-2 border-gray-400 bg-gray-100 font-bold">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2 text-right">{grandTotal.totalIpress}</td>
            {columns.map((c) => (
              <td key={c.key} className="px-3 py-2 text-right">
                {grandTotal.totals[c.key] ?? 0}
              </td>
            ))}
            <td className="px-3 py-2 text-right">{grandTotal.totalModulos}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RowGroup({
  row,
  columns,
  expanded,
  toggle,
}: {
  row: SummaryRow;
  columns: ReturnType<typeof modulesByGroup>;
  expanded: Set<string>;
  toggle: (key: string) => void;
}) {
  const isOpen = expanded.has(row.key);
  const hasChildren = !!row.children?.length;

  return (
    <>
      <tr
        className={`border-t border-gray-200 ${hasChildren ? "cursor-pointer hover:bg-blue-50" : ""}`}
        onClick={() => hasChildren && toggle(row.key)}
      >
        <td className="sticky left-0 bg-white px-3 py-2 font-medium">
          {hasChildren && <span className="mr-2 inline-block w-3">{isOpen ? "-" : "+"}</span>}
          {row.label}
        </td>
        <td className="px-3 py-2 text-right">{row.totalIpress}</td>
        {columns.map((c) => (
          <td key={c.key} className="px-3 py-2 text-right">
            {row.totals[c.key] ?? 0}
          </td>
        ))}
        <td className="px-3 py-2 text-right font-semibold">{row.totalModulos}</td>
      </tr>
      {isOpen &&
        row.children?.map((child) => (
          <tr key={child.key} className="border-t border-gray-100 bg-gray-50 text-gray-700">
            <td className="sticky left-0 bg-gray-50 py-1.5 pl-10 pr-3">{child.label}</td>
            <td className="px-3 py-1.5 text-right">{child.totalIpress}</td>
            {columns.map((c) => (
              <td key={c.key} className="px-3 py-1.5 text-right">
                {child.totals[c.key] ?? 0}
              </td>
            ))}
            <td className="px-3 py-1.5 text-right">{child.totalModulos}</td>
          </tr>
        ))}
    </>
  );
}
