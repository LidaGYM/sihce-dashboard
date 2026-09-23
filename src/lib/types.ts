export type DataSourceMode = "excel" | "sqlserver";

export interface IpressModuleRow {
  periodo: string; // "202608"
  nom_mes: string | null;
  departamento: string | null;
  disa: string | null;
  provincia: string;
  distrito: string | null;
  categoria: string | null;
  tipo_eess: string | null;
  cod_ipress: string | null;
  ipress: string;
  [moduleKey: string]: string | number | null; // mod_xxx flags (0/1)
}

export interface SummaryFilters {
  periodo: string; // requerido, ej "202608"
  categoria?: string; // "Todas" o una categoria puntual (I-1, I-2, I-3, II-1...)
  ipress?: string; // "Todas" o cod_ipress puntual
}

export interface ModuleTotals {
  [moduleKey: string]: number;
}

export interface SummaryRow {
  key: string;
  label: string;
  totalIpress: number;
  totals: ModuleTotals;
  totalModulos: number;
  children?: SummaryRow[];
}

export interface SummaryResponse {
  periodo: string;
  rows: SummaryRow[]; // nivel provincia, con children a nivel ipress
  grandTotal: SummaryRow;
  source: DataSourceMode;
  updatedAt: string | null;
}

export interface FiltersResponse {
  periodos: string[];
  categorias: string[];
  ipressList: { cod_ipress: string; ipress: string }[];
}
