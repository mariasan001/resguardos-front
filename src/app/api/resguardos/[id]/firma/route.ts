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
  return new URL(`/api/resguardos/${id}/firma`, getBackendBaseUrl());
}

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("manageFirma"),
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
      Accept: "image/png, image/jpeg, */*;q=0.8",
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const arrayBuffer = await response.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: response.status,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("manageFirma"),
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

  const formData = await request.formData();

  const response = await fetch(buildBackendUrl(id), {
    method: "POST",
    cache: "no-store",
    headers: await getBackendAuthHeaders(),
    body: formData,
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await response.json();

    return NextResponse.json(payload, {
      status: response.status,
    });
  }

  const payload = await response.text();

  return new NextResponse(payload, {
    status: response.status,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
}
