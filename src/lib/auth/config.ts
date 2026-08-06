export const SESSION_COOKIE_NAME = "resguardos_session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const DEVELOPMENT_AUTH_SECRET =
  "resguardos-local-development-secret-change-before-production";

export function getAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_AUTH_SECRET;
  }

  return undefined;
}
