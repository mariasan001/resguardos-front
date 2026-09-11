import type { SortDirection } from "@/components/ui/DataTable";

export type ResguardoListMode = "all" | "bajas";

export type ResguardoListSortKey =
  | "titular"
  | "adscripcion"
  | "fechaAsignacion"
  | "fechaActualizacion"
  | "estatus";

export interface ResguardoListSearchParams {
  q?: string;
  titular?: string;
  adscripcion?: string;
  fechaAsignacion?: string;
  fechaActualizacion?: string;
  estado?: string;
  page?: string;
  size?: string;
  sort?: string;
  dir?: string;
}

export interface ResguardoListPageProps {
  mode: ResguardoListMode;
  searchParams: Promise<ResguardoListSearchParams>;
}

export interface ResguardoListConfig {
  basePath: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  noResultsDescription: string;
  paginationLabel: string;
  showStats: boolean;
  showCreateAction: boolean;
  lockedEstado: string;
}

export interface ResguardoListQuery {
  q: string;
  titular: string;
  adscripcion: string;
  fechaAsignacion: string;
  fechaActualizacion: string;
  /** Filtro de estatus en UI (vacío en bajas). */
  estado: string;
  pageSize: number;
  sortKey: ResguardoListSortKey;
  sortDirection: SortDirection;
  requestedPage: number;
}

export interface ResguardoListHrefState extends ResguardoListQuery {
  currentPage: number;
  mode: ResguardoListMode;
  basePath: string;
}

export type PageItem =
  | { type: "gap"; page: number }
  | { type: "page"; page: number };
