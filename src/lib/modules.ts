// Definicion canonica de los modulos SIHCE que se muestran en el dashboard.
// Cada modulo corresponde a una columna "mod_x" (0/1) por IPRESS/periodo.
// Si tu vista de SQL Server o tu Excel real trae columnas con otros nombres,
// agrega el alias correspondiente en EXCEL_HEADER_ALIASES mas abajo: no hace
// falta tocar el resto del codigo.

export type ModuleGroup = "administrativo" | "asistencial";

export interface ModuleDef {
  key: string; // nombre de columna canonico, ej. "mod_citas"
  label: string; // texto mostrado en la tabla
  group: ModuleGroup;
}

export const MODULES: ModuleDef[] = [
  // --- Modulos Administrativo ---
  { key: "mod_refcon", label: "Refcon", group: "administrativo" },
  { key: "mod_referencias", label: "Referencias y Contrarreferencias", group: "administrativo" },
  { key: "mod_gestion", label: "Gestion Administrativa", group: "administrativo" },
  { key: "mod_citas", label: "Citas", group: "administrativo" },
  { key: "mod_triaje", label: "Triaje", group: "administrativo" },

  // --- Modulos Asistenciales ---
  { key: "mod_inmunizaciones", label: "Inmunizaciones", group: "asistencial" },
  { key: "mod_cred", label: "Cred", group: "asistencial" },
  { key: "mod_medicina", label: "Medicina", group: "asistencial" },
  { key: "mod_odontologia", label: "Odontologia", group: "asistencial" },
  { key: "mod_psicologia", label: "Psicologia", group: "asistencial" },
  { key: "mod_nutricion", label: "Nutricion", group: "asistencial" },
  { key: "mod_prenatal", label: "Prenatal", group: "asistencial" },
  { key: "mod_planificacion", label: "Planificacion", group: "asistencial" },
  { key: "mod_laboratorio", label: "Laboratorio", group: "asistencial" },
  { key: "mod_farmacia", label: "Farmacia", group: "asistencial" },
  { key: "mod_fua_electronica", label: "FUA Electronica", group: "asistencial" },
  { key: "mod_urgencias_emergencias", label: "Urgencias / Emergencias", group: "asistencial" },
];

export const MODULE_KEYS = MODULES.map((m) => m.key);

export function modulesByGroup(group: ModuleGroup): ModuleDef[] {
  return MODULES.filter((m) => m.group === group);
}

// Columnas de dimension (no son modulos, identifican al registro).
export const DIMENSION_COLUMNS = [
  "periodo",
  "nom_mes",
  "departamento",
  "disa",
  "provincia",
  "distrito",
  "categoria",
  "tipo_eess",
  "cod_ipress",
  "ipress",
] as const;

export type DimensionColumn = (typeof DIMENSION_COLUMNS)[number];

// Alias de encabezados que hemos visto en los Excel reales (BASE / BASE_INICIO_IMPL)
// hacia las columnas canonicas de arriba. Todo lo que no matchee aqui se guarda
// igual en la fila (columna "extra_json") para no perder informacion, pero no se
// suma en el dashboard hasta que se mapee explicitamente.
export const EXCEL_HEADER_ALIASES: Record<string, string> = {
  // dimensiones
  departamento: "departamento",
  disa: "disa",
  provincia: "provincia",
  distrito: "distrito",
  categoria: "categoria",
  tipo_eess: "tipo_eess",
  cod_ipress: "cod_ipress",
  ipress: "ipress",
  periodo: "periodo",
  nom_mes: "nom_mes",

  // modulos administrativos
  mod_refcon: "mod_refcon",
  refcon: "mod_refcon",
  mod_referencias: "mod_referencias",
  referencias: "mod_referencias",
  mod_gestion: "mod_gestion",
  gestion: "mod_gestion",
  mod_citas: "mod_citas",
  citas: "mod_citas",
  mod_triaje: "mod_triaje",
  triaje: "mod_triaje",

  // modulos asistenciales
  mod_inmunizaciones: "mod_inmunizaciones",
  inmunizaciones: "mod_inmunizaciones",
  mod_cred: "mod_cred",
  cred: "mod_cred",
  mod_medicina: "mod_medicina",
  mod_ce_med: "mod_medicina",
  medicina: "mod_medicina",
  mod_odontologia: "mod_odontologia",
  mod_bucal: "mod_odontologia",
  odontologia: "mod_odontologia",
  bucal: "mod_odontologia",
  mod_psicologia: "mod_psicologia",
  psicologia: "mod_psicologia",
  mod_nutricion: "mod_nutricion",
  nutricion: "mod_nutricion",
  mod_prenatal: "mod_prenatal",
  prenatal: "mod_prenatal",
  mod_planificacion: "mod_planificacion",
  planificacion: "mod_planificacion",
  mod_laboratorio: "mod_laboratorio",
  laboratorio: "mod_laboratorio",
  mod_farmacia: "mod_farmacia",
  farmacia: "mod_farmacia",
  mod_fua_electronica: "mod_fua_electronica",
  fua_electronica: "mod_fua_electronica",
  mod_urgencias_emergencias: "mod_urgencias_emergencias",
  urgencias_emergencias: "mod_urgencias_emergencias",
};
