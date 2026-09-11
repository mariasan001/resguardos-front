import { ESTADO_BAJA } from "@/lib/utils/resguardo-payload";

import type { ResguardoListConfig, ResguardoListMode } from "./types";

export const PAGE_SIZES = [10, 25, 50] as const;

export const SORT_KEYS = [
  "titular",
  "adscripcion",
  "fechaAsignacion",
  "fechaActualizacion",
  "estatus",
] as const;

export const LIST_CONFIG: Record<ResguardoListMode, ResguardoListConfig> = {
  all: {
    basePath: "/resguardos",
    title: "Listado de resguardos",
    emptyTitle: "Aún no hay resguardos",
    emptyDescription: "Registra el primer resguardo para comenzar el seguimiento.",
    noResultsDescription: "No se encontraron resguardos con los filtros actuales.",
    paginationLabel: "Paginación de resguardos",
    showStats: true,
    showCreateAction: true,
    lockedEstado: "",
  },
  bajas: {
    basePath: "/bajas",
    title: "Listado de bajas",
    emptyTitle: "Aún no hay bajas",
    emptyDescription: "Cuando un resguardo se dé de baja, aparecerá en este listado.",
    noResultsDescription: "No se encontraron bajas con los filtros actuales.",
    paginationLabel: "Paginación de bajas",
    showStats: true,
    showCreateAction: false,
    lockedEstado: String(ESTADO_BAJA),
  },
};

export function buildStatsFilterHref(nextEstado?: string) {
  if (nextEstado === String(ESTADO_BAJA)) {
    return "/bajas";
  }
  if (!nextEstado) {
    return "/resguardos";
  }
  return `/resguardos?estado=${encodeURIComponent(nextEstado)}`;
}
