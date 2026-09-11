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
import type { Resguardo } from "@/lib/types/api";
import { formatDate, formatTitleCase } from "@/lib/utils/format";
import styles from "@/app/(resguardos-list)/resguardos/page.module.css";

import { PAGE_SIZES, buildStatsFilterHref } from "./config";
import { buildListHref } from "./data";
import type {
  PageItem,
  ResguardoListConfig,
  ResguardoListHrefState,
  ResguardoListSortKey,
} from "./types";

interface ResguardoListProps {
  config: ResguardoListConfig;
  resguardos: Resguardo[];
  usuariosCount: number;
  activeEstado: string;
  scopedCount: number;
  paginated: Resguardo[];
  filteredCount: number;
  hasActiveFilters: boolean;
  sortKey: ResguardoListSortKey;
  sortDirection: SortDirection;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  visibleFrom: number;
  visibleTo: number;
  pageItems: PageItem[];
  hrefState: ResguardoListHrefState;
}

export default function ResguardoList({
  config,
  resguardos,
  usuariosCount,
  activeEstado,
  scopedCount,
  paginated,
  filteredCount,
  hasActiveFilters,
  sortKey,
  sortDirection,
  currentPage,
  totalPages,
  pageSize,
  visibleFrom,
  visibleTo,
  pageItems,
  hrefState,
}: ResguardoListProps) {
  function href(overrides: Record<string, string | number | undefined> = {}) {
    return buildListHref(hrefState, overrides);
  }

  const createAction = config.showCreateAction ? (
    <Link href="/resguardos/nuevo" className={styles.primaryAction}>
      <Plus size={16} strokeWidth={2} />
      Nuevo resguardo
    </Link>
  ) : null;

  const emptyUniverse = filteredCount === 0 && !hasActiveFilters;
  const clearFiltersAction = (
    <Link href={config.basePath} className={styles.secondaryAction}>
      Limpiar filtros
    </Link>
  );

  return (
    <section className={styles.page}>
      {config.showStats ? (
        <StatsOverview
          resguardos={resguardos}
          usuariosCount={usuariosCount}
          activeEstado={activeEstado}
          buildFilterHref={buildStatsFilterHref}
        />
      ) : null}

      <section className={styles.tableCard}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.listTitle}>{config.title}</h2>
          </div>
          {createAction}
        </header>

        {scopedCount > 0 ? (
          <div className={styles.mobileFilters} aria-label="Filtros del listado">
            <ColumnSearch
              param="titular"
              placeholder="Buscar titular"
              ariaLabel="Buscar por titular"
            />
            <ColumnSearch
              param="adscripcion"
              placeholder="Buscar adscripción"
              ariaLabel="Buscar por adscripción"
            />
            <ColumnDateFilter
              param="fechaAsignacion"
              ariaLabel="Filtrar por fecha de asignación"
            />
            <ColumnDateFilter
              param="fechaActualizacion"
              ariaLabel="Filtrar por fecha de actualización"
            />
          </div>
        ) : null}

        {paginated.length ? (
          <ul className={styles.mobileList}>
            {paginated.map((item) => (
              <li
                key={String(item.id ?? item.idInventario)}
                className={styles.mobileCard}
              >
                <div className={styles.mobileCardTop}>
                  <div className={styles.mobileCardCopy}>
                    <Link
                      href={`/resguardos/${item.id}`}
                      className={styles.mobileCardTitle}
                    >
                      {formatTitleCase(item.usuarioTitular?.nombre)}
                    </Link>
                    <p className={styles.mobileCardMeta}>
                      {formatTitleCase(
                        item.usuarioTitular?.adscripcion?.desAds,
                        "Sin adscripción",
                      )}
                    </p>
                  </div>
                  <div className={styles.mobileCardActions}>
                    <StatusBadge value={item.idEstadoResguardo} />
                    <ResguardoRowActions
                      id={item.id}
                      inventario={item.idInventario}
                    />
                  </div>
                </div>
                <dl className={styles.mobileCardFacts}>
                  <div>
                    <dt>Asignación</dt>
                    <dd>{formatDate(item.fechaAsignacion)}</dd>
                  </div>
                  <div>
                    <dt>Actualización</dt>
                    <dd>{formatDate(item.fechaActualizacion)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.mobileEmpty}>
            {emptyUniverse ? (
              <EmptyState
                title={config.emptyTitle}
                description={config.emptyDescription}
                actions={createAction ?? undefined}
              />
            ) : (
              <EmptyState
                title="Sin resultados"
                description={config.noResultsDescription}
                actions={clearFiltersAction}
              />
            )}
          </div>
        )}

        <div className={styles.desktopTable}>
          <DataTable
            embedded
            data={paginated}
            keyExtractor={(item) => String(item.id ?? item.idInventario)}
            emptyTitle="Sin coincidencias"
            emptyDescription={config.noResultsDescription}
            sort={{
              key: sortKey,
              direction: sortDirection,
              buildHref: (key, direction) =>
                href({ sort: key, dir: direction, page: 1 }),
            }}
            emptyContent={
              emptyUniverse ? (
                <EmptyState
                  title={config.emptyTitle}
                  description={config.emptyDescription}
                  actions={createAction ?? undefined}
                />
              ) : hasActiveFilters ? (
                <EmptyState
                  title="Sin resultados"
                  description={config.noResultsDescription}
                  actions={clearFiltersAction}
                />
              ) : undefined
            }
            columns={[
              {
                key: "titular",
                header: "Titular",
                sortable: true,
                filter:
                  scopedCount > 0 ? (
                    <ColumnSearch
                      param="titular"
                      placeholder="Buscar titular"
                      ariaLabel="Buscar por titular"
                    />
                  ) : undefined,
                render: (item) => (
                  <Link
                    href={`/resguardos/${item.id}`}
                    className={styles.primaryLink}
                  >
                    {formatTitleCase(item.usuarioTitular?.nombre)}
                  </Link>
                ),
              },
              {
                key: "adscripcion",
                header: "Adscripción",
                sortable: true,
                filter:
                  scopedCount > 0 ? (
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
                  scopedCount > 0 ? (
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
                  scopedCount > 0 ? (
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
                render: (item) => (
                  <StatusBadge value={item.idEstadoResguardo} />
                ),
              },
              {
                key: "acciones",
                header: "Acciones",
                align: "center",
                headerClassName: styles.actionsHeader,
                cellClassName: styles.actionsCell,
                render: (item) => (
                  <ResguardoRowActions
                    id={item.id}
                    inventario={item.idInventario}
                  />
                ),
              },
            ]}
          />
        </div>

        {filteredCount ? (
          <footer className={styles.pagination}>
            <p className={styles.paginationSummary}>
              Mostrando{" "}
              <strong>
                {visibleFrom}-{visibleTo}
              </strong>{" "}
              de <strong>{filteredCount}</strong> registros
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
                      href={href({ size, page: 1 })}
                      className={`${styles.pageSizeOption} ${
                        size === pageSize ? styles.pageSizeCurrent : ""
                      }`}
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
                  aria-label={config.paginationLabel}
                >
                  <Link
                    href={href({ page: currentPage - 1 })}
                    className={`${styles.paginationButton} ${
                      currentPage === 1 ? styles.paginationDisabled : ""
                    }`}
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
                          href={href({ page: item.page })}
                          className={`${styles.paginationButton} ${
                            item.page === currentPage
                              ? styles.paginationCurrent
                              : ""
                          }`}
                          aria-current={
                            item.page === currentPage ? "page" : undefined
                          }
                          scroll={false}
                        >
                          {item.page}
                        </Link>
                      ),
                    )}
                  </div>

                  <Link
                    href={href({ page: currentPage + 1 })}
                    className={`${styles.paginationButton} ${
                      currentPage === totalPages
                        ? styles.paginationDisabled
                        : ""
                    }`}
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
