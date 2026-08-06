import { NextResponse } from "next/server";

import { rejectUnauthenticatedRequest } from "@/lib/auth/api-authorization";
import { getBackendAuthHeaders } from "@/lib/auth/backend-headers";
import { getBackendBaseUrl } from "@/lib/config/env";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const unauthorizedResponse = await rejectUnauthenticatedRequest();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json(
      { message: "El identificador del resguardo es obligatorio." },
      { status: 400 },
    );
  }

  const response = await fetch(
    new URL(`/api/resguardos/${id}`, getBackendBaseUrl()),
    {
      method: "GET",
      cache: "no-store",
      headers: await getBackendAuthHeaders(),
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

export async function PUT(request: Request, context: RouteContext) {
  const unauthorizedResponse = await rejectUnauthenticatedRequest();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json(
      { message: "El identificador del resguardo es obligatorio." },
      { status: 400 },
    );
  }

  const body = await request.text();

  const response = await fetch(
    new URL(`/api/resguardos/${id}`, getBackendBaseUrl()),
    {
      method: "PUT",
      cache: "no-store",
      headers: await getBackendAuthHeaders({
        "Content-Type": "application/json",
      }),
      body,
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
