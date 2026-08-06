import { USER_ROLES, type UserRole } from "@/lib/auth/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.admin]: "Administrador",
  [USER_ROLES.encargado]: "Encargado",
};

export const AUTH_ROUTES = {
  login: "/login",
  adminHome: "/",
  encargadoHome: "/resguardos/nuevo",
} as const;

export function getHomeRoute(role: UserRole) {
  return role === USER_ROLES.admin
    ? AUTH_ROUTES.adminHome
    : AUTH_ROUTES.encargadoHome;
}

/**
 * Rutas permitidas por rol, alineadas a la matriz del backend.
 * ENCARGADO: crear resguardo, preview, consultar por ID y firma.
 * No listado global, catálogos admin, dashboard ni email.
 */
export function canAccessPath(role: UserRole, pathname: string) {
  if (role === USER_ROLES.admin) {
    return true;
  }

  if (pathname === "/resguardos/nuevo" || pathname.startsWith("/resguardos/nuevo/")) {
    return true;
  }

  // Detalle por ID: /resguardos/123 (no /resguardos ni /resguardos/nuevo)
  if (/^\/resguardos\/\d+(\/.*)?$/.test(pathname)) {
    return true;
  }

  return false;
}
