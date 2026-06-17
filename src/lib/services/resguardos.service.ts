import { backendRequest } from "@/lib/api/backend-client";
import type { Resguardo } from "@/lib/types/api";

export function getResguardos() {
  return backendRequest<Resguardo[]>("/api/resguardos/all");
}

export function getResguardoCount() {
  return backendRequest<number>("/api/resguardos/count");
}

export function getResguardoById(id: number) {
  return backendRequest<Resguardo>(`/api/resguardos/${id}`);
}

export function createResguardo(payload: Resguardo) {
  return backendRequest<Record<string, number>>("/api/resguardos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
