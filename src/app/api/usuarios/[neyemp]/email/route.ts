import { NextResponse } from "next/server";

import { authorizeApiRequest } from "@/lib/auth/api-authorization";
import { getBackendAuthHeaders } from "@/lib/auth/backend-headers";
import { rolesForApiCapability } from "@/lib/auth/permissions";
import { getBackendBaseUrl } from "@/lib/config/env";

interface RouteContext {
  params: Promise<{
    neyemp: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("updateUserEmail"),
  );

  if (error) {
    return error;
  }

  const { neyemp } = await context.params;

  if (!neyemp?.trim()) {
    return NextResponse.json(
      { message: "La clave del empleado es obligatoria." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud no es JSON valido." },
      { status: 400 },
    );
  }

  const response = await fetch(
    new URL(`/api/${neyemp}/email`, getBackendBaseUrl()),
    {
      method: "PATCH",
      cache: "no-store",
      headers: await getBackendAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    },
  );

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return NextResponse.json(payload, {
    status: response.status,
  });
}
