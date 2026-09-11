import type { SortDirection } from "@/components/ui/DataTable";
import type { Resguardo } from "@/lib/types/api";
import { getResguardos } from "@/lib/services/resguardos.server";
import { getUsuarios } from "@/lib/services/usuarios.server";
import { ESTADO_BAJA } from "@/lib/utils/resguardo-payload";
import { filterResguardos } from "@/lib/utils/format";

import { LIST_CONFIG, PAGE_SIZES, SORT_KEYS } from "./config";
import type {
  PageItem,
  ResguardoListHrefState,
  ResguardoListMode,
  ResguardoListQuery,
  ResguardoListSearchParams,
  ResguardoListSortKey,
} from "./types";

const PAGE_WINDOW = 2;

function getSortValue(resguardo: Resguardo, key: ResguardoListSortKey) {
  switch (key) {
    case "adscripcion":
      return resguardo.usuarioTitular?.adscripcion?.desAds ?? "";
    case "titular":
      return resguardo.usuarioTitular?.nombre ?? "";
    case "fechaAsignacion":
      return resguardo.fechaAsignacion ?? "";
    case "fechaActualizacion":
      return resguardo.fechaActualizacion ?? "";
    case "estatus":
      return resguardo.idEstadoResguardo ?? 0;
  }
}

export function sortResguardos(
  resguardos: Resguardo[],
  key: ResguardoListSortKey,
  direction: SortDirection,
) {
  const factor = direction === "asc" ? 1 : -1;

  return [...resguardos].sort((left, right) => {
    const leftValue = getSortValue(left, key);
    const rightValue = getSortValue(right, key);

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * factor;
    }

    return (
      String(leftValue).localeCompare(String(rightValue), "es-MX", {
        sensitivity: "base",
      }) * factor
    );
  });
}

export function buildPageItems(currentPage: number, totalPages: number): PageItem[] {
  const pages = new Set<number>([1, totalPages]);

  for (let page = currentPage - PAGE_WINDOW; page <= currentPage + PAGE_WINDOW; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const ordered = [...pages].sort((left, right) => left - right);

  return ordered.flatMap((page, index) =>
    index > 0 && page - ordered[index - 1] > 1
      ? [{ type: "gap" as const, page }, { type: "page" as const, page }]
      : [{ type: "page" as const, page }],
  );
}

export function resolveListQuery(
  mode: ResguardoListMode,
  params: ResguardoListSearchParams,
): ResguardoListQuery {
  const config = LIST_CONFIG[mode];
  const requestedSize = Number(params.size ?? PAGE_SIZES[0]);

  return {
    q: params.q ?? "",
    titular: params.titular ?? "",
    adscripcion: params.adscripcion ?? "",
    fechaAsignacion: params.fechaAsignacion ?? "",
    fechaActualizacion: params.fechaActualizacion ?? "",
    estado: config.lockedEstado || (params.estado ?? ""),
    pageSize: PAGE_SIZES.includes(requestedSize as (typeof PAGE_SIZES)[number])
      ? requestedSize
      : PAGE_SIZES[0],
    sortKey: SORT_KEYS.includes(params.sort as ResguardoListSortKey)
      ? (params.sort as ResguardoListSortKey)
      : "fechaAsignacion",
    sortDirection: params.dir === "asc" ? "asc" : "desc",
    requestedPage: Number(params.page ?? "1"),
  };
}

/** Resguardos = todo menos bajas. Bajas = solo estatus Baja. */
export function scopeResguardosByMode(
  resguardos: Resguardo[],
  mode: ResguardoListMode,
) {
  return mode === "bajas"
    ? resguardos.filter((item) => item.idEstadoResguardo === ESTADO_BAJA)
    : resguardos.filter((item) => item.idEstadoResguardo !== ESTADO_BAJA);
}

export function buildListHref(
  state: ResguardoListHrefState,
  overrides: Record<string, string | number | undefined> = {},
) {
  const search = new URLSearchParams();
  const next = {
    q: state.q,
    titular: state.titular,
    adscripcion: state.adscripcion,
    fechaAsignacion: state.fechaAsignacion,
    fechaActualizacion: state.fechaActualizacion,
    estado: state.mode === "bajas" ? "" : state.estado,
    size: state.pageSize,
    sort: state.sortKey,
    dir: state.sortDirection,
    page: state.currentPage,
    ...overrides,
  };

  if (String(next.q).trim()) {
    search.set("q", String(next.q).trim());
  }
  if (String(next.titular).trim()) {
    search.set("titular", String(next.titular).trim());
  }
  if (String(next.adscripcion).trim()) {
    search.set("adscripcion", String(next.adscripcion).trim());
  }
  if (String(next.fechaAsignacion).trim()) {
    search.set("fechaAsignacion", String(next.fechaAsignacion).trim());
  }
  if (String(next.fechaActualizacion).trim()) {
    search.set("fechaActualizacion", String(next.fechaActualizacion).trim());
  }
  if (state.mode === "all" && next.estado) {
    search.set("estado", String(next.estado));
  }
  if (Number(next.size) !== PAGE_SIZES[0]) {
    search.set("size", String(next.size));
  }
  if (next.sort !== "fechaAsignacion" || next.dir !== "desc") {
    search.set("sort", String(next.sort));
    search.set("dir", String(next.dir));
  }
  if (Number(next.page) > 1) {
    search.set("page", String(next.page));
  }

  const query = search.toString();
  return query ? `${state.basePath}?${query}` : state.basePath;
}

export async function loadResguardoListData(
  mode: ResguardoListMode,
  params: ResguardoListSearchParams,
) {
  const config = LIST_CONFIG[mode];
  const query = resolveListQuery(mode, params);

  const [resguardos, usuariosResult] = await Promise.all([
    getResguardos(),
    Promise.allSettled([getUsuarios()]).then(([result]) => result),
  ]);

  const usuarios =
    usuariosResult.status === "fulfilled" ? usuariosResult.value : [];

  const scopedResguardos = scopeResguardosByMode(resguardos, mode);
  const listEstado = mode === "bajas" ? "" : query.estado;

  const filtered = sortResguardos(
    filterResguardos(scopedResguardos, query.q, listEstado, {
      titular: query.titular,
      adscripcion: query.adscripcion,
      fechaAsignacion: query.fechaAsignacion,
      fechaActualizacion: query.fechaActualizacion,
    }),
    query.sortKey,
    query.sortDirection,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const currentPage = Number.isFinite(query.requestedPage)
    ? Math.min(Math.max(Math.trunc(query.requestedPage), 1), totalPages)
    : 1;
  const pageStart = (currentPage - 1) * query.pageSize;
  const paginated = filtered.slice(pageStart, pageStart + query.pageSize);

  const hasActiveFilters = Boolean(
    query.q.trim() ||
      query.titular.trim() ||
      query.adscripcion.trim() ||
      query.fechaAsignacion ||
      query.fechaActualizacion ||
      (mode === "all" && query.estado),
  );

  const hrefState: ResguardoListHrefState = {
    ...query,
    currentPage,
    mode,
    basePath: config.basePath,
  };

  return {
    config,
    query,
    resguardos,
    usuariosCount: usuarios.length,
    scopedResguardos,
    filtered,
    paginated,
    totalPages,
    currentPage,
    pageStart,
    visibleFrom: filtered.length ? pageStart + 1 : 0,
    visibleTo: pageStart + paginated.length,
    hasActiveFilters,
    pageItems: buildPageItems(currentPage, totalPages),
    hrefState,
  };
}
