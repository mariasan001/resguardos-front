import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";
import { USER_ROLES } from "@/lib/auth/types";

const SECRET = "test-secret-for-session-token";

function buildPayload(overrides: Partial<{ expiresAt: number }> = {}) {
  return {
    id: "1",
    name: "Admin",
    username: "admin",
    role: USER_ROLES.admin,
    accessToken: "backend-jwt",
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

describe("session-token", () => {
  it("firma y verifica un payload valido", async () => {
    const payload = buildPayload();
    const token = await createSessionToken(payload, SECRET);
    const verified = await verifySessionToken(token, SECRET);

    expect(verified).toMatchObject({
      id: "1",
      username: "admin",
      role: USER_ROLES.admin,
      accessToken: "backend-jwt",
    });
  });

  it("rechaza tokens alterados", async () => {
    const token = await createSessionToken(buildPayload(), SECRET);
    const [payloadPart] = token.split(".");
    const tampered = `${payloadPart}.invalid-signature`;

    expect(await verifySessionToken(tampered, SECRET)).toBeNull();
  });

  it("rechaza tokens expirados", async () => {
    const token = await createSessionToken(
      buildPayload({ expiresAt: Date.now() - 1_000 }),
      SECRET,
    );

    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("rechaza secretos incorrectos o ausentes", async () => {
    const token = await createSessionToken(buildPayload(), SECRET);

    expect(await verifySessionToken(token, "other-secret")).toBeNull();
    expect(await verifySessionToken(token, undefined)).toBeNull();
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
  });
});
