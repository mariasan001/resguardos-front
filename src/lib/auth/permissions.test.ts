import { describe, expect, it } from "vitest";

import {
  canAccessPath,
  canUseApiCapability,
  getHomeRoute,
} from "@/lib/auth/permissions";
import { USER_ROLES } from "@/lib/auth/types";

describe("canAccessPath", () => {
  it("permite al admin cualquier ruta de la app", () => {
    expect(canAccessPath(USER_ROLES.admin, "/")).toBe(true);
    expect(canAccessPath(USER_ROLES.admin, "/usuarios")).toBe(true);
    expect(canAccessPath(USER_ROLES.admin, "/catalogos")).toBe(true);
  });

  it("limita al encargado a alta, preview y detalle por id", () => {
    expect(canAccessPath(USER_ROLES.encargado, "/resguardos/nuevo")).toBe(true);
    expect(
      canAccessPath(USER_ROLES.encargado, "/resguardos/nuevo/preview"),
    ).toBe(true);
    expect(canAccessPath(USER_ROLES.encargado, "/resguardos/42")).toBe(true);
    expect(canAccessPath(USER_ROLES.encargado, "/resguardos")).toBe(false);
    expect(canAccessPath(USER_ROLES.encargado, "/bajas")).toBe(false);
    expect(canAccessPath(USER_ROLES.encargado, "/")).toBe(false);
    expect(canAccessPath(USER_ROLES.encargado, "/usuarios")).toBe(false);
    expect(canAccessPath(USER_ROLES.encargado, "/catalogos")).toBe(false);
  });

  it("permite al admin la sección de bajas", () => {
    expect(canAccessPath(USER_ROLES.admin, "/bajas")).toBe(true);
  });
});

describe("canUseApiCapability", () => {
  it("bloquea updateResguardo, listResguardos y readLogs para encargado", () => {
    expect(
      canUseApiCapability(USER_ROLES.encargado, "updateResguardo"),
    ).toBe(false);
    expect(canUseApiCapability(USER_ROLES.admin, "updateResguardo")).toBe(true);
    expect(
      canUseApiCapability(USER_ROLES.encargado, "listResguardos"),
    ).toBe(false);
    expect(canUseApiCapability(USER_ROLES.admin, "listResguardos")).toBe(true);
    expect(canUseApiCapability(USER_ROLES.encargado, "readLogs")).toBe(false);
    expect(canUseApiCapability(USER_ROLES.admin, "readLogs")).toBe(true);
  });

  it("permite operaciones de alta y firma a ambos roles", () => {
    for (const capability of [
      "createResguardo",
      "readResguardo",
      "manageFirma",
      "sendResguardoEmail",
      "updateUserEmail",
      "readCatalogos",
      "readAppUsers",
    ] as const) {
      expect(canUseApiCapability(USER_ROLES.admin, capability)).toBe(true);
      expect(canUseApiCapability(USER_ROLES.encargado, capability)).toBe(true);
    }
  });

  it("permite manageAppUsers solo a admin", () => {
    expect(canUseApiCapability(USER_ROLES.admin, "manageAppUsers")).toBe(true);
    expect(canUseApiCapability(USER_ROLES.encargado, "manageAppUsers")).toBe(
      false,
    );
  });
});

describe("getHomeRoute", () => {
  it("redirige cada rol a su home", () => {
    expect(getHomeRoute(USER_ROLES.admin)).toBe("/");
    expect(getHomeRoute(USER_ROLES.encargado)).toBe("/resguardos/nuevo");
  });
});
