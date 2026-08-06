import { NextResponse } from "next/server";

import { authorizeApiRequest } from "@/lib/auth/api-authorization";
import { rolesForApiCapability } from "@/lib/auth/permissions";
import { getAccesorios } from "@/lib/services/catalogos.service";

export async function GET() {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("readCatalogos"),
  );

  if (error) {
    return error;
  }

  const accesorios = await getAccesorios().catch(() => []);

  return NextResponse.json(accesorios);
}
