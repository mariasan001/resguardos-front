import "server-only";

import { getAccessToken } from "@/lib/auth/session";

/** Headers Authorization para proxies Next → backend. */
export async function getBackendAuthHeaders(
  extra?: HeadersInit,
): Promise<HeadersInit> {
  const token = await getAccessToken();
  const headers = new Headers(extra);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, text/plain;q=0.9, */*;q=0.8");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}
