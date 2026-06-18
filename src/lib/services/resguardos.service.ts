import { backendRequest } from "@/lib/api/backend-client";
import { ApiError } from "@/lib/api/errors";
import { getBackendBaseUrl } from "@/lib/config/env";
import type {
  CreateResguardoResponse,
  Resguardo,
  UploadResguardoFirmaResponse,
} from "@/lib/types/api";

async function parsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json()
    : response.text();
}

async function readBlobResponse(response: Response) {
  if (response.ok) {
    return response.blob();
  }

  const payload = await response.text();

  if (response.status === 404) {
    throw new ApiError(
      "No hay firma registrada para este resguardo.",
      response.status,
      payload,
    );
  }

  if (response.status === 410) {
    throw new ApiError(
      "La firma esta registrada, pero el archivo ya no esta disponible.",
      response.status,
      payload,
    );
  }

  throw new ApiError(
    payload.trim() || "No fue posible consultar la firma del resguardo.",
    response.status,
    payload,
  );
}

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
      const payload = await parsePayload(response);

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
      const payload = await parsePayload(response);

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

export function uploadResguardoFirma(resguardoId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  if (typeof window !== "undefined") {
    return fetch(`/api/resguardos/${resguardoId}/firma`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      body: formData,
    }).then(async (response) => {
      const payload = await parsePayload(response);

      if (!response.ok) {
        const message =
          typeof payload === "string" && payload.trim()
            ? payload
            : response.status === 400
              ? "La firma no es valida o el archivo esta vacio."
              : response.status === 404
                ? "No se encontro el resguardo para guardar la firma."
                : "No fue posible guardar la firma del resguardo.";

        throw new ApiError(message, response.status, payload);
      }

      return payload as UploadResguardoFirmaResponse;
    });
  }

  return backendRequest<UploadResguardoFirmaResponse>(
    `/api/resguardos/${resguardoId}/firma`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export function getResguardoFirma(resguardoId: number) {
  if (typeof window !== "undefined") {
    return fetch(`/api/resguardos/${resguardoId}/firma`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "image/png, image/jpeg, */*;q=0.8",
      },
    }).then(readBlobResponse);
  }

  return fetch(new URL(`/api/resguardos/${resguardoId}/firma`, getBackendBaseUrl()), {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "image/png, image/jpeg, */*;q=0.8",
    },
  }).then(readBlobResponse);
}
