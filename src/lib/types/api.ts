export type Nullable<T> = T | null | undefined;

export interface Adscripcion {
  necads?: string;
  desAds?: string;
}

export interface Puesto {
  id?: string;
  des_neccat?: string;
}

export interface AppUser {
  neyemp?: string;
  nombre?: string;
  email?: string;
  adscripcion?: Adscripcion;
  puesto?: Puesto;
}

export interface Accesorio {
  id?: number;
  descAccesorio?: string;
}

export interface CatColorMaterial {
  id?: number;
  descMaterial?: string;
}

export interface CatModelo {
  id?: number;
  descModelo?: string;
}

export interface CatProcesador {
  id?: number;
  descProcesador?: string;
}

export interface CatSo {
  id?: number;
  descSo?: string;
}

export interface CatTipoBien {
  id?: number;
  descTipoBien?: string;
}

export interface DetalleResguardo {
  id?: number;
  accesorio?: Accesorio;
  numeroSerie?: string;
}

export interface Resguardo {
  id?: number;
  ip?: string;
  marca?: string;
  idInventario?: string;
  fechaAsignacion?: string;
  resguardo?: string;
  observaciones?: string;
  usuarioResguarda?: AppUser;
  usuarioAsigna?: AppUser;
  usuarioTitular?: AppUser;
  fechaDevolucion?: string;
  idEstadoResguardo?: number;
  telefono?: string;
  fechaCreacion?: string;
  sistemaOperativo?: CatSo;
  tipoBien?: CatTipoBien;
  modelo?: CatModelo;
  numeroSerie?: string;
  mac?: string;
  colorMaterial?: CatColorMaterial;
  procesador?: CatProcesador;
  detalles?: DetalleResguardo[];
}

export interface CatalogosBundle {
  accesorios: Accesorio[];
  colores: CatColorMaterial[];
  modelos: CatModelo[];
  procesadores: CatProcesador[];
  puestos: Puesto[];
  sistemasOperativos: CatSo[];
  tiposBien: CatTipoBien[];
}

export interface OptionItem {
  value: string;
  label: string;
  helper?: string;
}

export interface ResguardoDetailInput {
  accesorioId: string;
  numeroSerie: string;
}

export interface CreateResguardoInput {
  idInventario: string;
  marca: string;
  resguardo: string;
  fechaAsignacion: string;
  observaciones: string;
  telefono: string;
  ip: string;
  numeroSerie: string;
  mac: string;
  idEstadoResguardo: string;
  tipoBienId: string;
  modeloId: string;
  sistemaOperativoId: string;
  colorMaterialId: string;
  procesadorId: string;
  usuarioTitularId: string;
  usuarioResguardaId: string;
  usuarioAsignaId: string;
  detalles: ResguardoDetailInput[];
}

export interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  createdId?: number;
}
