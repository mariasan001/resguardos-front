import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { authorizeApiRequest } from "@/lib/auth/api-authorization";
import { rolesForApiCapability } from "@/lib/auth/permissions";
import {
  getAppUserByNeyemp,
  updateAppUser,
} from "@/lib/services/usuarios.server";
import type { AppUserWritePayload } from "@/lib/types/api";

interface RouteContext {
  params: Promise<{
    neyemp: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("readAppUsers"),
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

  try {
    const user = await getAppUserByNeyemp(neyemp);
    return NextResponse.json(user);
  } catch (caught) {
    const status = caught instanceof ApiError ? caught.status : 502;
    const message =
      caught instanceof Error ? caught.message : "No fue posible consultar el usuario.";
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("manageAppUsers"),
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

  let body: Omit<AppUserWritePayload, "neyemp">;

  try {
    body = (await request.json()) as Omit<AppUserWritePayload, "neyemp">;
  } catch {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud no es JSON valido." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAppUser(neyemp, body);
    return NextResponse.json(updated);
  } catch (caught) {
    const status = caught instanceof ApiError ? caught.status : 502;
    const message =
      caught instanceof Error ? caught.message : "No fue posible actualizar el usuario.";
    return NextResponse.json({ message }, { status });
  }
}
