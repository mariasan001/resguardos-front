import "server-only";

import { getBackendBaseUrl } from "@/lib/config/env";
import { ApiError } from "@/lib/api/errors";
import {
  mapBackendRole,
  type AuthUser,
  type BackendLoginResponse,
} from "@/lib/auth/types";

export async function authenticateUser(
  username: string,
  password: string,
): Promise<AuthUser | null> {
  const response = await fetch(`${getBackendBaseUrl()}/api/auth/login`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username.trim(),
      password,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | BackendLoginResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return null;
    }

    const message =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : `Error HTTP ${response.status}`;

    throw new ApiError(message ?? `Error HTTP ${response.status}`, response.status, payload);
  }

  const login = payload as BackendLoginResponse | null;

  if (!login?.accessToken || !login.user) {
    return null;
  }

  const role = mapBackendRole(login.user.roles);

  if (!role || login.user.activo === false) {
    return null;
  }

  return {
    id: String(login.user.id),
    name: login.user.nombre?.trim() || login.user.username,
    username: login.user.username,
    email: login.user.email,
    role,
    accessToken: login.accessToken,
    expiresIn: login.expiresIn,
  };
}

export async function logoutBackend(accessToken: string) {
  try {
    await fetch(`${getBackendBaseUrl()}/api/auth/logout`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    // Logout es stateless: borrar cookie local basta aunque el backend falle.
  }
}
