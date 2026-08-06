import { ApiError } from "@/lib/api/errors";
import type { AppUser } from "@/lib/types/api";

export async function updateUsuarioEmail(neyemp: string, email: string) {
  const response = await fetch(`/api/usuarios/${neyemp}/email`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    },
    body: JSON.stringify({ email }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string" && payload.trim()
        ? payload
        : `Error HTTP ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as AppUser;
}
