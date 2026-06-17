import { backendRequest } from "@/lib/api/backend-client";
import type { AppUser } from "@/lib/types/api";

export function getUsuarios() {
  return backendRequest<AppUser[]>("/api/usuarios");
}

export async function getUsuarioById(id: string) {
  return backendRequest<AppUser>(`/api/usuarios/${id}`);
}

export async function updateUsuarioEmail(neyemp: string, email: string) {
  return backendRequest<AppUser>(`/api/${neyemp}/email`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
}
