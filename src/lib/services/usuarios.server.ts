import "server-only";

import { serverBackendRequest } from "@/lib/api/server-backend";
import type {
  AppUser,
  AppUserPage,
  AppUsersQuery,
  AppUserWritePayload,
} from "@/lib/types/api";

export function getUsuarios() {
  return serverBackendRequest<AppUser[]>("/api/usuarios");
}

export function getUsuarioById(id: string) {
  return serverBackendRequest<AppUser>(`/api/usuarios/${id}`);
}

function buildAppUsersQuery(params: AppUsersQuery = {}) {
  const searchParams = new URLSearchParams();
  const page = params.page ?? 0;
  const size = params.size ?? 20;

  searchParams.set("page", String(Math.max(0, page)));
  searchParams.set("size", String(Math.min(100, Math.max(1, size))));

  if (params.sort?.trim()) {
    searchParams.set("sort", params.sort.trim());
  }

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  return searchParams.toString();
}

export function getAppUsersPage(params: AppUsersQuery = {}) {
  const query = buildAppUsersQuery(params);
  return serverBackendRequest<AppUserPage>(`/api/appusers?${query}`);
}

export function getAppUserByNeyemp(neyemp: string) {
  return serverBackendRequest<AppUser>(
    `/api/appusers/${encodeURIComponent(neyemp)}`,
  );
}

export function createAppUser(body: AppUserWritePayload) {
  return serverBackendRequest<AppUser>("/api/appusers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function updateAppUser(neyemp: string, body: Omit<AppUserWritePayload, "neyemp">) {
  return serverBackendRequest<AppUser>(
    `/api/appusers/${encodeURIComponent(neyemp)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}
