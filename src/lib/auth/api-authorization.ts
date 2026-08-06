import "server-only";

import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/types";

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

/**
 * Exige sesión válida y, opcionalmente, uno de los roles indicados.
 * Devuelve la sesión cuando el request puede continuar.
 */
export async function authorizeApiRequest(allowedRoles?: readonly UserRole[]) {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { message: "La sesión no es válida o ha expirado." },
        { status: 401 },
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { message: "No tienes permiso para realizar esta acción." },
        { status: 403 },
      ),
    };
  }

  return { session, error: null };
}
