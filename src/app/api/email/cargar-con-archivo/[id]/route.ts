import { NextResponse } from "next/server";

import { rejectUnauthenticatedRequest } from "@/lib/auth/api-authorization";
import { getBackendAuthHeaders } from "@/lib/auth/backend-headers";
import { getBackendBaseUrl } from "@/lib/config/env";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
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

  const formData = await request.formData();

  const response = await fetch(
    new URL(`/api/email/cargar-con-archivo/${id}`, getBackendBaseUrl()),
    {
      method: "POST",
      cache: "no-store",
      headers: await getBackendAuthHeaders(),
      body: formData,
    },
  );

  const contentType = response.headers.get("content-type") ?? "";
  const payload = await response.text();

  return new NextResponse(payload, {
    status: response.status,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
}
