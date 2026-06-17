const DEFAULT_BACKEND_URL = "http://localhost:9999";

export function getBackendBaseUrl() {
  return process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_URL;
}
