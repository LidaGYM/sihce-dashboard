"use client";

import { ModuleGroup } from "@/lib/modules";

interface Props {
  active: ModuleGroup;
  onChange: (group: ModuleGroup) => void;
}

export default function Tabs({ active, onChange }: Props) {
  const tabClass = (group: ModuleGroup) =>
    `px-6 py-2 text-sm font-semibold rounded-t-md ${
      active === group ? "bg-sihce-header text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
    }`;

  return (
    <div className="flex gap-1">
      <button className={tabClass("administrativo")} onClick={() => onChange("administrativo")}>
        Modulos Administrativo
      </button>
      <button className={tabClass("asistencial")} onClick={() => onChange("asistencial")}>
        Modulos Asistenciales
      </button>
    </div>
  );
}
