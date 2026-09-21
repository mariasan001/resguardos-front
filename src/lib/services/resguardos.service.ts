import { ApiError } from "@/lib/api/errors";
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

async function readQrBlobResponse(response: Response) {
  if (response.ok) {
    return response.blob();
  }

  const payload = await response.text();

  if (response.status === 404) {
    throw new ApiError(
      "No se encontro el resguardo para generar el QR.",
      response.status,
      payload,
    );
  }

  if (response.status === 422) {
    throw new ApiError(
      "La informacion del resguardo es demasiado grande para el codigo QR.",
      response.status,
      payload,
    );
  }

  throw new ApiError(
    payload.trim() || "No fue posible obtener el codigo QR del resguardo.",
    response.status,
    payload,
  );
}

/** Cliente: siempre pasa por rutas Next autenticadas. */
export function getResguardoById(id: number) {
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

export function createResguardo(payload: Resguardo) {
  return fetch("/api/resguardos", {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const result = await parsePayload(response);

    if (!response.ok) {
      const message =
        typeof result === "string" && result.trim()
          ? result
          : `Error HTTP ${response.status}`;

      throw new ApiError(message, response.status, result);
    }

    return result as CreateResguardoResponse;
  });
}

export function updateResguardo(id: number, payload: Resguardo) {
  return fetch(`/api/resguardos/${id}`, {
    method: "PUT",
    cache: "no-store",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const result = await parsePayload(response);

    if (!response.ok) {
      const message =
        typeof result === "string" && result.trim()
          ? result
          : response.status === 403
            ? "Solo un administrador puede editar un resguardo."
            : response.status === 404
              ? "El resguardo que intentas editar ya no existe."
              : `Error HTTP ${response.status}`;

      throw new ApiError(message, response.status, result);
    }

    return result as Resguardo;
  });
}

export function uploadResguardoFirma(resguardoId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

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

export function getResguardoFirma(resguardoId: number) {
  return fetch(`/api/resguardos/${resguardoId}/firma`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "image/png, image/jpeg, */*;q=0.8",
    },
  }).then(readBlobResponse);
}

/** PNG del QR dinámico. Requiere sesión; no usar en <img src> directo. */
export function getResguardoQr(resguardoId: number) {
  return fetch(`/api/resguardos/${resguardoId}/qr`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "image/png, */*;q=0.8",
    },
  }).then(readQrBlobResponse);
}
