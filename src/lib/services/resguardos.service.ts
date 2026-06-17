import { backendRequest } from "@/lib/api/backend-client";
import { ApiError } from "@/lib/api/errors";
import type { CreateResguardoResponse, Resguardo } from "@/lib/types/api";

export function getResguardos() {
  return backendRequest<Resguardo[]>("/api/resguardos/all");
}

export function getResguardoCount() {
  return backendRequest<number>("/api/resguardos/count");
}

export function getResguardoById(id: number) {
  if (typeof window !== "undefined") {
    return fetch(`/api/resguardos/${id}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
    }).then(async (response) => {
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

      return payload as Resguardo;
    });
  }

  return backendRequest<Resguardo>(`/api/resguardos/${id}`);
}

export function createResguardo(payload: Resguardo) {
  if (typeof window !== "undefined") {
    return fetch("/api/resguardos", {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).then(async (response) => {
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

      return payload as CreateResguardoResponse;
    });
  }

  return backendRequest<CreateResguardoResponse>("/api/resguardos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
