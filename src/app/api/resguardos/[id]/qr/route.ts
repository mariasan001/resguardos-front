import { NextResponse } from "next/server";

import { authorizeApiRequest } from "@/lib/auth/api-authorization";
import { getBackendAuthHeaders } from "@/lib/auth/backend-headers";
import { rolesForApiCapability } from "@/lib/auth/permissions";
import { getBackendBaseUrl } from "@/lib/config/env";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function buildBackendUrl(id: string) {
  return new URL(`/api/resguardos/${id}/qr`, getBackendBaseUrl());
}

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("readResguardo"),
  );

  if (error) {
    return error;
  }

  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json(
      { message: "El identificador del resguardo es obligatorio." },
      { status: 400 },
    );
  }

  const response = await fetch(buildBackendUrl(id), {
    method: "GET",
    cache: "no-store",
    headers: await getBackendAuthHeaders({
      Accept: "image/png, */*;q=0.8",
    }),
  });

  const contentType = response.headers.get("content-type") ?? "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });

  const disposition = response.headers.get("content-disposition");
  if (disposition) {
    headers.set("Content-Disposition", disposition);
  }

  const payloadMode = response.headers.get("x-resguardo-qr-payload");
  if (payloadMode) {
    headers.set("X-Resguardo-Qr-Payload", payloadMode);
  }

  return new NextResponse(arrayBuffer, {
    status: response.status,
    headers,
  });
}
