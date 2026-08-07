import { NextResponse } from "next/server";

import { authorizeApiRequest } from "@/lib/auth/api-authorization";
import { rolesForApiCapability } from "@/lib/auth/permissions";
import { getAdscripciones } from "@/lib/services/catalogos.service";

export async function GET() {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("readCatalogos"),
  );

  if (error) {
    return error;
  }

  const adscripciones = await getAdscripciones().catch(() => []);

  return NextResponse.json(adscripciones);
}
