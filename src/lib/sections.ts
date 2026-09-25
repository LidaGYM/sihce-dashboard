import { MODULES, ModuleDef, modulesByGroup } from "./modules";

export interface ColumnGroup {
  title: string;
  modules: ModuleDef[];
}

export interface SectionDef {
  title: string; // texto del boton en la portada
  groups: ColumnGroup[];
  showCalificadasFilter: boolean;
  showTotalModulos: boolean;
  // "totales": provincias con mas IPRESS primero e IPRESS con mas modulos primero (vista general).
  // "alfabetico": provincias e IPRESS por nombre (vistas por seccion).
  order: "totales" | "alfabetico";
}

function pick(...keys: string[]): ModuleDef[] {
  return keys.map((k) => {
    const m = MODULES.find((x) => x.key === k);
    if (!m) throw new Error(`Modulo desconocido: ${k}`);
    return m;
  });
}

export const GENERAL: SectionDef = {
  title: "Modulos en General",
  groups: [
    { title: "Modulos Administrativo", modules: modulesByGroup("administrativo") },
    { title: "Modulos Asistenciales", modules: modulesByGroup("asistencial") },
  ],
  showCalificadasFilter: true,
  showTotalModulos: true,
  order: "totales",
};

export const SECTIONS: Record<string, SectionDef> = {
  administrativos: {
    title: "Modulos Administrativos",
    groups: [
      {
        title: "Modulos Administrativo",
        modules: pick("mod_refcon", "mod_referencias", "mod_gestion", "mod_citas", "mod_fua_electronica"),
      },
    ],
    showCalificadasFilter: false,
    showTotalModulos: false,
    order: "alfabetico",
  },
  "consulta-externa": {
    title: "Modulos de Consulta Externa",
    groups: [
      {
        title: "Modulos de Consulta Externa",
        modules: pick("mod_triaje", "mod_medicina", "mod_odontologia", "mod_psicologia", "mod_nutricion"),
      },
    ],
    showCalificadasFilter: false,
    showTotalModulos: false,
    order: "alfabetico",
  },
  estrategias: {
    title: "Modulos de Estrategias",
    groups: [
      {
        title: "Modulos de Estrategias",
        modules: pick(
          "mod_inmunizaciones",
          "mod_cred",
          "mod_prenatal",
          "mod_planificacion",
          "mod_laboratorio",
          "mod_farmacia",
          "mod_urgencias_emergencias"
        ),
      },
    ],
    showCalificadasFilter: false,
    showTotalModulos: false,
    order: "alfabetico",
  },
};
