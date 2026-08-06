import { describe, expect, it } from "vitest";

import { mapBackendRole, USER_ROLES } from "@/lib/auth/types";

describe("mapBackendRole", () => {
  it("mapea ADMIN y ENCARGADO", () => {
    expect(mapBackendRole(["ADMIN"])).toBe(USER_ROLES.admin);
    expect(mapBackendRole(["ENCARGADO"])).toBe(USER_ROLES.encargado);
  });

  it("prioriza ADMIN si vienen ambos", () => {
    expect(mapBackendRole(["ENCARGADO", "ADMIN"])).toBe(USER_ROLES.admin);
  });

  it("rechaza roles desconocidos o vacios", () => {
    expect(mapBackendRole([])).toBeNull();
    expect(mapBackendRole(undefined)).toBeNull();
    expect(mapBackendRole(["OTRO"])).toBeNull();
  });
});
