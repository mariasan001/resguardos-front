import { NextResponse } from "next/server";

import { rejectUnauthenticatedRequest } from "@/lib/auth/api-authorization";
import { getAccesorios } from "@/lib/services/catalogos.service";

export async function GET() {
  const unauthorizedResponse = await rejectUnauthenticatedRequest();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const accesorios = await getAccesorios().catch(() => []);

  return NextResponse.json(accesorios);
}
