import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getAuthSecret,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/config";
import { getHomeRoute } from "@/lib/auth/permissions";
import { logoutBackend } from "@/lib/auth/provider";
import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";
import type { AuthUser, UserRole } from "@/lib/auth/types";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token, getAuthSecret());
}

export async function getAccessToken() {
  const session = await getSession();
  return session?.accessToken;
}

export async function createSession(
  user: AuthUser,
  expiresInSeconds?: number,
) {
  const secret = getAuthSecret();

  if (!secret) {
    throw new Error(
      "AUTH_SECRET es obligatorio para habilitar sesiones en producción.",
    );
  }

  const durationMs =
    typeof expiresInSeconds === "number" && expiresInSeconds > 0
      ? expiresInSeconds * 1000
      : SESSION_DURATION_MS;
  const expiresAt = Date.now() + durationMs;
  const token = await createSessionToken({ ...user, expiresAt }, secret);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token, getAuthSecret());

  if (session?.accessToken) {
    await logoutBackend(session.accessToken);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireSession();

  if (!roles.includes(session.role)) {
    redirect(getHomeRoute(session.role));
  }

  return session;
}
