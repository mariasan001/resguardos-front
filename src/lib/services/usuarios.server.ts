import "server-only";

import { serverBackendRequest } from "@/lib/api/server-backend";
import type { AppUser } from "@/lib/types/api";

export function getUsuarios() {
  return serverBackendRequest<AppUser[]>("/api/usuarios");
}

export function getUsuarioById(id: string) {
  return serverBackendRequest<AppUser>(`/api/usuarios/${id}`);
}
