import { getBackendBaseUrl } from "@/lib/config/env";
import { ApiError } from "@/lib/api/errors";

type ParseMode = "json" | "text" | "auto";

interface RequestOptions extends RequestInit {
  parse?: ParseMode;
}

function buildUrl(path: string) {
  return new URL(path, getBackendBaseUrl()).toString();
}

async function parseResponse(response: Response, parse: ParseMode) {
  if (parse === "text") {
    return response.text();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const shouldParseJson =
    parse === "json" || contentType.includes("application/json");

  if (shouldParseJson) {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return response.text();
}

export async function backendRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { headers, parse = "auto", ...init } = options;

  const response = await fetch(buildUrl(path), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      ...headers,
    },
  });

  const payload = await parseResponse(response, parse);

  if (!response.ok) {
    const message =
      typeof payload === "string" && payload.trim()
        ? payload
        : `Error HTTP ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
