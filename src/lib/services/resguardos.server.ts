import "server-only";

import { serverBackendRequest } from "@/lib/api/server-backend";
import type { Resguardo } from "@/lib/types/api";

export function getResguardos() {
  return serverBackendRequest<Resguardo[]>("/api/resguardos/all");
}

export function getResguardoCount() {
  return serverBackendRequest<number>("/api/resguardos/count");
}

export function getResguardoByIdServer(id: number) {
  return serverBackendRequest<Resguardo>(`/api/resguardos/${id}`);
}
