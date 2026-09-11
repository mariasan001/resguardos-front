import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import { ESTADO_BAJA } from "@/lib/utils/resguardo-payload";

import { LIST_CONFIG } from "./config";
import { loadResguardoListData } from "./data";
import ResguardoList from "./ResguardoList";
import type { ResguardoListPageProps } from "./types";

export type {
  ResguardoListMode,
  ResguardoListSearchParams,
} from "./types";

export default async function ResguardoListPage({
  mode,
  searchParams,
}: ResguardoListPageProps) {
  await requireRole([USER_ROLES.admin]);
  const params = await searchParams;

  // Las bajas viven en /bajas; no filtrarlas dentro de /resguardos.
  if (mode === "all" && (params.estado ?? "") === String(ESTADO_BAJA)) {
    redirect("/bajas");
  }

  const data = await loadResguardoListData(mode, params);
  const config = LIST_CONFIG[mode];

  return (
    <ResguardoList
      config={config}
      resguardos={data.resguardos}
      usuariosCount={data.usuariosCount}
      activeEstado={data.query.estado}
      scopedCount={data.scopedResguardos.length}
      paginated={data.paginated}
      filteredCount={data.filtered.length}
      hasActiveFilters={data.hasActiveFilters}
      sortKey={data.query.sortKey}
      sortDirection={data.query.sortDirection}
      currentPage={data.currentPage}
      totalPages={data.totalPages}
      pageSize={data.query.pageSize}
      visibleFrom={data.visibleFrom}
      visibleTo={data.visibleTo}
      pageItems={data.pageItems}
      hrefState={data.hrefState}
    />
  );
}
