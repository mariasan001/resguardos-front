import "server-only";

import { backendRequest } from "@/lib/api/backend-client";
import { getAccessToken } from "@/lib/auth/session";

type BackendRequestOptions = Parameters<typeof backendRequest>[1];

/** Request al backend con el JWT de la sesión actual (solo servidor). */
export async function serverBackendRequest<T>(
  path: string,
  options: BackendRequestOptions = {},
): Promise<T> {
  const accessToken = options?.accessToken ?? (await getAccessToken());

  return backendRequest<T>(path, {
    ...options,
    accessToken: accessToken ?? undefined,
  });
}
