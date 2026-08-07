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

/** Roles que pueden operar el flujo de alta / consulta por ID / firma / email. */
export const OPERATIONAL_ROLES = [
  USER_ROLES.admin,
  USER_ROLES.encargado,
] as const;

/** Mutaciones de resguardo existente (edición): solo admin. */
export const ADMIN_ONLY_ROLES = [USER_ROLES.admin] as const;

export function getHomeRoute(role: UserRole) {
  return role === USER_ROLES.admin
    ? AUTH_ROUTES.adminHome
    : AUTH_ROUTES.encargadoHome;
}

/**
 * Rutas permitidas por rol, alineadas a la matriz del backend.
 * ENCARGADO: crear resguardo, preview, consultar por ID y firma.
 * No listado global, catálogos admin, dashboard ni administración de usuarios.
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

export type ApiCapability =
  | "createResguardo"
  | "readResguardo"
  | "listResguardos"
  | "updateResguardo"
  | "manageFirma"
  | "updateUserEmail"
  | "sendResguardoEmail"
  | "readCatalogos"
  | "readLogs"
  | "readAppUsers"
  | "manageAppUsers";

const API_CAPABILITY_ROLES: Record<ApiCapability, readonly UserRole[]> = {
  createResguardo: OPERATIONAL_ROLES,
  readResguardo: OPERATIONAL_ROLES,
  /** GET /api/resguardos/all y /count: solo admin (matriz backend). */
  listResguardos: ADMIN_ONLY_ROLES,
  updateResguardo: ADMIN_ONLY_ROLES,
  manageFirma: OPERATIONAL_ROLES,
  updateUserEmail: OPERATIONAL_ROLES,
  sendResguardoEmail: OPERATIONAL_ROLES,
  readCatalogos: OPERATIONAL_ROLES,
  readLogs: ADMIN_ONLY_ROLES,
  /** Listado/consulta AppUser: ADMIN y ENCARGADO según backend. */
  readAppUsers: OPERATIONAL_ROLES,
  /** Crear/actualizar AppUser: solo ADMIN. */
  manageAppUsers: ADMIN_ONLY_ROLES,
};

export function rolesForApiCapability(capability: ApiCapability) {
  return API_CAPABILITY_ROLES[capability];
}

export function canUseApiCapability(role: UserRole, capability: ApiCapability) {
  return API_CAPABILITY_ROLES[capability].includes(role);
}
