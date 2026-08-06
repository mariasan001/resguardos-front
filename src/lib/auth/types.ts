export const USER_ROLES = {
  admin: "admin",
  encargado: "encargado",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Roles que regresa el backend en JWT /api/auth/me */
export const BACKEND_ROLES = {
  ADMIN: "ADMIN",
  ENCARGADO: "ENCARGADO",
} as const;

export type BackendRole = (typeof BACKEND_ROLES)[keyof typeof BACKEND_ROLES];

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  accessToken: string;
  expiresIn?: number;
}

export interface SessionPayload extends AuthUser {
  expiresAt: number;
}

export interface LoginActionState {
  success: boolean;
  message?: string;
  fieldErrors?: {
    username?: string;
    password?: string;
  };
}

export interface BackendLoginResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: {
    id: number;
    username: string;
    nombre?: string;
    email?: string;
    roles?: string[];
    activo?: boolean;
  };
}

export function mapBackendRole(roles: string[] | undefined): UserRole | null {
  if (!roles?.length) {
    return null;
  }

  if (roles.includes(BACKEND_ROLES.ADMIN)) {
    return USER_ROLES.admin;
  }

  if (roles.includes(BACKEND_ROLES.ENCARGADO)) {
    return USER_ROLES.encargado;
  }

  return null;
}
