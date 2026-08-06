import "server-only";

import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";

export async function rejectUnauthenticatedRequest() {
  const session = await getSession();

  if (session) {
    return null;
  }

  return NextResponse.json(
    { message: "La sesión no es válida o ha expirado." },
    { status: 401 },
  );
}
