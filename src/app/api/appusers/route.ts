import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { authorizeApiRequest } from "@/lib/auth/api-authorization";
import { rolesForApiCapability } from "@/lib/auth/permissions";
import { createAppUser, getAppUsersPage } from "@/lib/services/usuarios.server";
import type { AppUserWritePayload } from "@/lib/types/api";

export async function GET(request: Request) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("readAppUsers"),
  );

  if (error) {
    return error;
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "0");
  const size = Number(searchParams.get("size") ?? "20");
  const sort = searchParams.get("sort") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const result = await getAppUsersPage({
      page: Number.isFinite(page) ? page : 0,
      size: Number.isFinite(size) ? size : 20,
      sort: sort || undefined,
      search: search || undefined,
    });
    return NextResponse.json(result);
  } catch (caught) {
    const status = caught instanceof ApiError ? caught.status : 502;
    const message =
      caught instanceof Error ? caught.message : "No fue posible listar usuarios.";
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  const { error } = await authorizeApiRequest(
    rolesForApiCapability("manageAppUsers"),
  );

  if (error) {
    return error;
  }

  let body: AppUserWritePayload;

  try {
    body = (await request.json()) as AppUserWritePayload;
  } catch {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud no es JSON valido." },
      { status: 400 },
    );
  }

  try {
    const created = await createAppUser(body);
    return NextResponse.json(created, { status: 201 });
  } catch (caught) {
    const status = caught instanceof ApiError ? caught.status : 502;
    const message =
      caught instanceof Error ? caught.message : "No fue posible crear el usuario.";
    return NextResponse.json({ message }, { status });
  }
}
