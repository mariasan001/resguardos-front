import { NextResponse } from "next/server";

import { authorizeApiRequest } from "@/lib/auth/api-authorization";
import { getBackendAuthHeaders } from "@/lib/auth/backend-headers";
import { rolesForApiCapability } from "@/lib/auth/permissions";
import { getBackendBaseUrl } from "@/lib/config/env";
import { getResguardos } from "@/lib/services/resguardos.server";
import type { Resguardo } from "@/lib/types/api";
import { resolveInventoryId } from "@/lib/utils/inventory-id";

export async function POST(request: Request) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("createResguardo"),
  );

  if (error) {
    return error;
  }

  let body: Resguardo;

  try {
    const payload: unknown = await request.json();

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Invalid payload");
    }

    body = payload as Resguardo;
  } catch {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud no es JSON valido." },
      { status: 400 },
    );
  }

  const existingResguardos = await getResguardos();
  const idInventario = resolveInventoryId(body.idInventario, existingResguardos);
  const response = await fetch(
    new URL("/api/resguardos", getBackendBaseUrl()),
    {
      method: "POST",
      cache: "no-store",
      headers: await getBackendAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        ...body,
        idInventario,
      }),
    },
  );

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  const responsePayload =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? { ...payload, idInventario }
      : payload;

  return NextResponse.json(responsePayload, {
    status: response.status,
  });
}
