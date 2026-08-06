import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getAuthSecret,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/config";
import {
  canAccessPath,
  getHomeRoute,
} from "@/lib/auth/permissions";
import { verifySessionToken } from "@/lib/auth/session-token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token, getAuthSecret());

  if (pathname === "/login") {
    if (!session) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL(getHomeRoute(session.role), request.url),
    );
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessPath(session.role, pathname)) {
    return NextResponse.redirect(
      new URL(getHomeRoute(session.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/resguardos/:path*",
    "/usuarios/:path*",
    "/catalogos/:path*",
  ],
};
