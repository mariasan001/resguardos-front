import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import AppUserModal from "@/features/usuarios/AppUserModal";
import UsuariosTable from "@/features/usuarios/UsuariosTable";
import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import {
  getAdscripciones,
  getPuestos,
} from "@/lib/services/catalogos.service";
import { getAppUsersPage } from "@/lib/services/usuarios.server";
import styles from "@/app/(workspace)/usuarios/page.module.css";

const PAGE_SIZES = [10, 20, 50];
const SORT_OPTIONS = [
  { value: "nombre,asc", label: "Nombre A-Z" },
  { value: "nombre,desc", label: "Nombre Z-A" },
  { value: "neyemp,asc", label: "Clave ascendente" },
  { value: "email,asc", label: "Correo A-Z" },
] as const;

interface UsuariosPageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
    sort?: string;
    search?: string;
  }>;
}

function buildPageItems(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  return Array.from(pages)
    .sort((a, b) => a - b)
    .flatMap((page, index, list) => {
      const previous = list[index - 1];
      if (previous && page - previous > 1) {
        return [{ type: "gap" as const, key: `gap-${previous}` }, { type: "page" as const, page }];
      }
      return [{ type: "page" as const, page }];
    });
}

export default async function UsuariosPage({ searchParams }: UsuariosPageProps) {
  await requireRole([USER_ROLES.admin]);
  const params = await searchParams;

  const requestedSize = Number(params.size ?? PAGE_SIZES[1]);
  const pageSize = PAGE_SIZES.includes(requestedSize) ? requestedSize : PAGE_SIZES[1];
  const requestedPage = Number(params.page ?? "1");
  const uiPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.trunc(requestedPage) : 1;
  const sort =
    SORT_OPTIONS.some((option) => option.value === params.sort)
      ? (params.sort as string)
      : "nombre,asc";
  const search = params.search?.trim() ?? "";

  const [pageData, adscripcionesResult, puestosResult] = await Promise.all([
    getAppUsersPage({
      page: uiPage - 1,
      size: pageSize,
      sort,
      search: search || undefined,
    }).catch(() => ({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: pageSize,
      first: true,
      last: true,
    })),
    getAdscripciones().catch(() => []),
    getPuestos().catch(() => []),
  ]);

  const totalPages = Math.max(1, pageData.totalPages || 1);
  const currentPage = Math.min(uiPage, totalPages);
  const usuarios = pageData.content ?? [];
  const pageItems = buildPageItems(currentPage, totalPages);

  function buildHref(overrides: Record<string, string | number | undefined>) {
    const next = {
      page: currentPage,
      size: pageSize,
      sort,
      search,
      ...overrides,
    };
    const query = new URLSearchParams();

    if (Number(next.page) > 1) {
      query.set("page", String(next.page));
    }
    if (Number(next.size) !== PAGE_SIZES[1]) {
      query.set("size", String(next.size));
    }
    if (String(next.sort) !== "nombre,asc") {
      query.set("sort", String(next.sort));
    }
    if (String(next.search).trim()) {
      query.set("search", String(next.search).trim());
    }

    const qs = query.toString();
    return qs ? `/usuarios?${qs}` : "/usuarios";
  }

  return (
    <div className={styles.page}>
      <PageHeader
        plain
        compact
        title="Directorio administrativo"
        action={
          <AppUserModal
            compact
            showCreateTrigger
            adscripciones={adscripcionesResult}
            puestos={puestosResult}
          />
        }
      />

      <Panel compact title="Listado">
        <form className={styles.toolbar} method="get">
          <label className={styles.searchField}>
            <Search size={15} strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              name="search"
              className={styles.searchInput}
              defaultValue={search}
              placeholder="Buscar por clave, nombre o correo"
              aria-label="Buscar usuarios"
            />
          </label>

          <label className={styles.sortField}>
            <span className={styles.sortLabel}>Orden</span>
            <select
              name="sort"
              className={styles.sortSelect}
              defaultValue={sort}
              aria-label="Ordenar listado"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <input type="hidden" name="size" value={pageSize} />
          <button type="submit" className={styles.filterButton}>
            Buscar
          </button>
        </form>

        <UsuariosTable
          usuarios={usuarios}
          adscripciones={adscripcionesResult}
          puestos={puestosResult}
          search={search}
        />

        <footer className={styles.pagination}>
          <p className={styles.paginationSummary}>
            Mostrando <strong>{usuarios.length}</strong> de{" "}
            <strong>{pageData.totalElements}</strong>
          </p>

          <div className={styles.paginationControls}>
            <div className={styles.pageSizeGroup} role="group" aria-label="Tamaño de página">
              {PAGE_SIZES.map((size) => (
                <Link
                  key={size}
                  href={buildHref({ size, page: 1 })}
                  className={`${styles.pageSizeOption} ${
                    size === pageSize ? styles.pageSizeCurrent : ""
                  }`}
                >
                  {size}
                </Link>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className={styles.paginationNav}>
                <Link
                  href={buildHref({ page: currentPage - 1 })}
                  className={`${styles.paginationButton} ${
                    currentPage === 1 ? styles.paginationDisabled : ""
                  }`}
                  aria-disabled={currentPage === 1}
                  tabIndex={currentPage === 1 ? -1 : undefined}
                >
                  <ChevronLeft size={16} strokeWidth={2} />
                </Link>

                <div className={styles.paginationPages}>
                  {pageItems.map((item) =>
                    item.type === "gap" ? (
                      <span key={item.key} className={styles.paginationGap}>
                        …
                      </span>
                    ) : (
                      <Link
                        key={item.page}
                        href={buildHref({ page: item.page })}
                        className={`${styles.paginationButton} ${
                          item.page === currentPage ? styles.paginationCurrent : ""
                        }`}
                      >
                        {item.page}
                      </Link>
                    ),
                  )}
                </div>

                <Link
                  href={buildHref({ page: currentPage + 1 })}
                  className={`${styles.paginationButton} ${
                    currentPage === totalPages ? styles.paginationDisabled : ""
                  }`}
                  aria-disabled={currentPage === totalPages}
                  tabIndex={currentPage === totalPages ? -1 : undefined}
                >
                  <ChevronRight size={16} strokeWidth={2} />
                </Link>
              </div>
            ) : null}
          </div>
        </footer>
      </Panel>
    </div>
  );
}
