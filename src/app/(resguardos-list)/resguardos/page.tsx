import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import StatsOverview from "@/components/dashboard/StatsOverview";
import DataTable from "@/components/ui/DataTable";
import type { SortDirection } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import ColumnDateFilter from "@/features/resguardos/ColumnDateFilter";
import ColumnSearch from "@/features/resguardos/ColumnSearch";
import ResguardoRowActions from "@/features/resguardos/ResguardoRowActions";
import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import type { Resguardo } from "@/lib/types/api";
import { getResguardos } from "@/lib/services/resguardos.server";
import { getUsuarios } from "@/lib/services/usuarios.server";
import { filterResguardos, formatDate, formatTitleCase } from "@/lib/utils/format";
import styles from "@/app/(resguardos-list)/resguardos/page.module.css";

interface ResguardosPageProps {
  searchParams: Promise<{
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
  }>;
}

const PAGE_SIZES = [10, 25, 50];
const SORT_KEYS = [
  "titular",
  "adscripcion",
  "fechaAsignacion",
  "fechaActualizacion",
  "estatus",
] as const;

type SortKey = (typeof SORT_KEYS)[number];

function getSortValue(resguardo: Resguardo, key: SortKey) {
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

function sortResguardos(
  resguardos: Resguardo[],
  key: SortKey,
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

const PAGE_WINDOW = 2;

function buildPageItems(currentPage: number, totalPages: number) {
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

export default async function ResguardosPage({
  searchParams,
}: ResguardosPageProps) {
  await requireRole([USER_ROLES.admin]);
  const params = await searchParams;
  const q = params.q ?? "";
  const titular = params.titular ?? "";
  const adscripcion = params.adscripcion ?? "";
  const fechaAsignacionFilter = params.fechaAsignacion ?? "";
  const fechaActualizacionFilter = params.fechaActualizacion ?? "";
  const estado = params.estado ?? "";
  const requestedPage = Number(params.page ?? "1");
  const requestedSize = Number(params.size ?? PAGE_SIZES[0]);
  const pageSize = PAGE_SIZES.includes(requestedSize)
    ? requestedSize
    : PAGE_SIZES[0];
  const sortKey = SORT_KEYS.includes(params.sort as SortKey)
    ? (params.sort as SortKey)
    : "fechaAsignacion";
  const sortDirection: SortDirection = params.dir === "asc" ? "asc" : "desc";

  const [resguardos, usuariosResult] = await Promise.all([
    getResguardos(),
    Promise.allSettled([getUsuarios()]).then(([result]) => result),
  ]);
  const usuarios =
    usuariosResult.status === "fulfilled" ? usuariosResult.value : [];

  const filtered = sortResguardos(
    filterResguardos(resguardos, q, estado, {
      titular,
      adscripcion,
      fechaAsignacion: fechaAsignacionFilter,
      fechaActualizacion: fechaActualizacionFilter,
    }),
    sortKey,
    sortDirection,
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.trunc(requestedPage), 1), totalPages)
    : 1;
  const pageStart = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(pageStart, pageStart + pageSize);
  const visibleFrom = filtered.length ? pageStart + 1 : 0;
  const visibleTo = pageStart + paginated.length;
  const hasActiveFilters = Boolean(
    q.trim() ||
      titular.trim() ||
      adscripcion.trim() ||
      fechaAsignacionFilter ||
      fechaActualizacionFilter ||
      estado,
  );

  function buildHref(overrides: Record<string, string | number | undefined>) {
    const search = new URLSearchParams();
    const next = {
      q,
      titular,
      adscripcion,
      fechaAsignacion: fechaAsignacionFilter,
      fechaActualizacion: fechaActualizacionFilter,
      estado,
      size: pageSize,
      sort: sortKey,
      dir: sortDirection,
      page: currentPage,
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

    if (next.estado) {
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
    return query ? `/resguardos?${query}` : "/resguardos";
  }

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <section className={styles.page}>
      <StatsOverview
        resguardos={resguardos}
        usuariosCount={usuarios.length}
        activeEstado={estado}
        buildFilterHref={(nextEstado) =>
          buildHref({ estado: nextEstado ?? "", page: 1 })
        }
      />

      <section className={styles.tableCard}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.listTitle}>Listado de resguardos</h2>
          </div>

          <Link href="/resguardos/nuevo" className={styles.primaryAction}>
            <Plus size={16} strokeWidth={2} />
            Nuevo resguardo
          </Link>
        </header>

        <DataTable
          embedded
          data={paginated}
          keyExtractor={(item) => String(item.id ?? item.idInventario)}
          emptyTitle="Sin coincidencias"
          emptyDescription="No hay resguardos con los filtros actuales."
          sort={{
            key: sortKey,
            direction: sortDirection,
            buildHref: (key, direction) =>
              buildHref({ sort: key, dir: direction, page: 1 }),
          }}
          emptyContent={
            resguardos.length === 0 ? (
              <EmptyState
                title="Aun no hay resguardos"
                description="Registra el primer resguardo para comenzar el seguimiento."
                actions={
                  <Link href="/resguardos/nuevo" className={styles.primaryAction}>
                    <Plus size={16} strokeWidth={2} />
                    Nuevo resguardo
                  </Link>
                }
              />
            ) : hasActiveFilters ? (
              <EmptyState
                title="Sin resultados"
                description="No se encontraron resguardos con los filtros actuales."
                actions={
                  <Link href="/resguardos" className={styles.secondaryAction}>
                    Limpiar filtros
                  </Link>
                }
              />
            ) : undefined
          }
          columns={[
            {
              key: "titular",
              header: "Titular",
              sortable: true,
              filter:
                resguardos.length > 0 ? (
                  <ColumnSearch
                    param="titular"
                    placeholder="Buscar titular"
                    ariaLabel="Buscar por titular"
                  />
                ) : undefined,
              render: (item) => (
                <Link href={`/resguardos/${item.id}`} className={styles.primaryLink}>
                  {formatTitleCase(item.usuarioTitular?.nombre)}
                </Link>
              ),
            },
            {
              key: "adscripcion",
              header: "Adscripción",
              sortable: true,
              filter:
                resguardos.length > 0 ? (
                  <ColumnSearch
                    param="adscripcion"
                    placeholder="Buscar adscripción"
                    ariaLabel="Buscar por adscripción"
                  />
                ) : undefined,
              render: (item) =>
                formatTitleCase(
                  item.usuarioTitular?.adscripcion?.desAds,
                  "Sin adscripción",
                ),
            },
            {
              key: "fechaAsignacion",
              header: "Fecha de asignación",
              sortable: true,
              filter:
                resguardos.length > 0 ? (
                  <ColumnDateFilter
                    param="fechaAsignacion"
                    ariaLabel="Filtrar por fecha de asignación"
                  />
                ) : undefined,
              render: (item) => formatDate(item.fechaAsignacion),
            },
            {
              key: "fechaActualizacion",
              header: "Fecha de actualización",
              sortable: true,
              align: "center",
              filter:
                resguardos.length > 0 ? (
                  <ColumnDateFilter
                    param="fechaActualizacion"
                    ariaLabel="Filtrar por fecha de actualización"
                  />
                ) : undefined,
              render: (item) => formatDate(item.fechaActualizacion),
            },
            {
              key: "estatus",
              header: "Estatus",
              sortable: true,
              align: "center",
              render: (item) => <StatusBadge value={item.idEstadoResguardo} />,
            },
            {
              key: "acciones",
              header: "Acciones",
              align: "center",
              headerClassName: styles.actionsHeader,
              cellClassName: styles.actionsCell,
              render: (item) => (
                <ResguardoRowActions id={item.id} inventario={item.idInventario} />
              ),
            },
          ]}
        />

        {filtered.length ? (
          <footer className={styles.pagination}>
            <p className={styles.paginationSummary}>
              Mostrando{" "}
              <strong>
                {visibleFrom}-{visibleTo}
              </strong>{" "}
              de <strong>{filtered.length}</strong> registros
            </p>

            <div className={styles.paginationControls}>
              <div className={styles.pageSize}>
                <span className={styles.pageSizeLabel} id="page-size-label">
                  Filas por página
                </span>
                <div
                  className={styles.pageSizeOptions}
                  role="group"
                  aria-labelledby="page-size-label"
                >
                  {PAGE_SIZES.map((size) => (
                    <Link
                      key={size}
                      href={buildHref({ size, page: 1 })}
                      className={`${styles.pageSizeOption} ${size === pageSize ? styles.pageSizeCurrent : ""}`}
                      aria-current={size === pageSize ? "true" : undefined}
                      scroll={false}
                    >
                      {size}
                    </Link>
                  ))}
                </div>
              </div>

              {totalPages > 1 ? (
                <nav
                  className={styles.paginationNav}
                  aria-label="Paginacion de resguardos"
                >
                  <Link
                    href={buildHref({ page: currentPage - 1 })}
                    className={`${styles.paginationButton} ${currentPage === 1 ? styles.paginationDisabled : ""}`}
                    aria-label="Página anterior"
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : undefined}
                    scroll={false}
                  >
                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                  </Link>

                  <div className={styles.paginationPages}>
                    {pageItems.map((item) =>
                      item.type === "gap" ? (
                        <span
                          key={`gap-${item.page}`}
                          className={styles.paginationGap}
                          aria-hidden="true"
                        >
                          …
                        </span>
                      ) : (
                        <Link
                          key={item.page}
                          href={buildHref({ page: item.page })}
                          className={`${styles.paginationButton} ${item.page === currentPage ? styles.paginationCurrent : ""}`}
                          aria-current={item.page === currentPage ? "page" : undefined}
                          scroll={false}
                        >
                          {item.page}
                        </Link>
                      ),
                    )}
                  </div>

                  <Link
                    href={buildHref({ page: currentPage + 1 })}
                    className={`${styles.paginationButton} ${currentPage === totalPages ? styles.paginationDisabled : ""}`}
                    aria-label="Página siguiente"
                    aria-disabled={currentPage === totalPages}
                    tabIndex={currentPage === totalPages ? -1 : undefined}
                    scroll={false}
                  >
                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </nav>
              ) : null}
            </div>
          </footer>
        ) : null}
      </section>
    </section>
  );
}
