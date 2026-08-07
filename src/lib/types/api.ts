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

export interface AppUserWritePayload {
  neyemp?: string;
  nombre: string;
  email: string;
  necads: string;
  neccat: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export type AppUserPage = PageResponse<AppUser>;

export interface AppUsersQuery {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

export interface Accesorio {
  id?: number;
  descAccesorio?: string;
  /** @deprecated Capturar marca en DetalleResguardo. */
  marca?: CatMarca | string | null;
  /** @deprecated Capturar modelo en DetalleResguardo. */
  modelo?: string | null;
  /** @deprecated Usar DetalleResguardo.idMarca. */
  idMarca?: number;
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

export interface CatMarca {
  id?: number;
  descMarca?: string;
}

export interface DetalleResguardo {
  id?: number;
  accesorio?: Accesorio;
  marca?: CatMarca | string;
  modelo?: CatModelo | string;
  numeroSerie?: string;
  idMarca?: number;
  idModelo?: number;
}

export interface Resguardo {
  id?: number;
  ip?: string;
  marca?: CatMarca | string;
  idMarca?: number;
  idInventario?: string;
  fechaAsignacion?: string;
  fechaActualizacion?: string;
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
  firmaPath?: string;
  firmaNombreArchivo?: string;
  firmaContentType?: string;
  firmaSizeBytes?: number;
  fechaFirma?: string;
  firmaUrl?: string;
  /** Solo en PUT: usuario que modifica, para bitácora. No se persiste en el resguardo. */
  usuarioModifica?: string;
}

export interface ResguardoLog {
  id?: number;
  resguardoId?: number;
  campo?: string;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  fechaCambio?: string;
  tipoEvento?: string;
  usuarioModifica?: string | null;
}

export type CreateResguardoResponse = Record<string, unknown>;
export type UploadResguardoFirmaResponse = Record<string, unknown>;

export interface CatalogosBundle {
  accesorios: Accesorio[];
  colores: CatColorMaterial[];
  marcas: CatMarca[];
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
  searchText?: string;
  email?: string;
  marca?: string;
  marcaId?: string;
  modelo?: string;
}

export type SelectOptionsState = "ready" | "empty" | "error";

export interface SelectOptionsSource {
  options: OptionItem[];
  state: SelectOptionsState;
  message?: string;
}

export interface ResguardoCatalogSources {
  accesorios: SelectOptionsSource;
  colores: SelectOptionsSource;
  marcas: SelectOptionsSource;
  modelos: SelectOptionsSource;
  procesadores: SelectOptionsSource;
  sistemasOperativos: SelectOptionsSource;
  tiposBien: SelectOptionsSource;
  usuarios: SelectOptionsSource;
}

export interface PreviewAccesorioDraft {
  id: string;
  /** Id del detalle en backend; necesario para actualizar sin perder el primero. */
  detalleId?: number;
  accesorioId: string;
  accesorioLabel: string;
  marcaId?: string;
  marcaLabel?: string;
  modeloId?: string;
  modeloLabel?: string;
  numeroSerie: string;
}

export interface PreviewResguardoDraft {
  idInventario: string;
  marca: string;
  marcaId?: string;
  referenciaInterna: string;
  fechaAsignacion: string;
  observaciones: string;
  telefono: string;
  ip: string;
  numeroSerie: string;
  mac: string;
  idEstadoResguardo: string;
  estadoLabel: string;
  tipoBienLabel: string;
  modeloLabel: string;
  sistemaOperativoLabel: string;
  colorMaterialLabel: string;
  procesadorLabel: string;
  usuarioTitularLabel: string;
  usuarioTitularHelper?: string;
  usuarioTitularEmail?: string;
  usuarioResguardaLabel: string;
  usuarioResguardaHelper?: string;
  usuarioAsignaLabel: string;
  usuarioAsignaHelper?: string;
  resguardo?: string;
  signatureDataUrl?: string;
  createdResguardoId?: number;
  editingResguardoId?: number;
  editSignatureMode?: "saved" | "new";
  tipoBienId?: string;
  modeloId?: string;
  sistemaOperativoId?: string;
  colorMaterialId?: string;
  procesadorId?: string;
  usuarioTitularId?: string;
  usuarioResguardaId?: string;
  usuarioAsignaId?: string;
  detalles: PreviewAccesorioDraft[];
}

export interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}
