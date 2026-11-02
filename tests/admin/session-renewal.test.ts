import { SignJWT, decodeJwt } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_SESSION_TTL_SECONDS,
  adminSessionCookieOptions,
  renewedAdminToken,
} from "@/lib/admin-session-policy";

const SECRET = "s".repeat(40);
const DAY = 24 * 60 * 60;
const now = () => Math.floor(Date.now() / 1000);

async function token(
  claims: Record<string, unknown>,
  exp: number,
  secret = SECRET,
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("a1")
    .setIssuedAt(1)
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secret));
}

const session = {
  name: "Owner",
  email: "o@x.test",
  role: "Owner",
  perms: ["orders"],
  superAdmin: true,
};

describe("admin sessions stay signed in while used", () => {
  beforeEach(() => vi.stubEnv("NEXTAUTH_SECRET", SECRET));
  afterEach(() => vi.unstubAllEnvs());

  it("lasts 90 days and is Lax, so a tap on a notification from another app carries it", () => {
    expect(ADMIN_SESSION_TTL_SECONDS).toBe(90 * DAY);
    expect(adminSessionCookieOptions()).toMatchObject({
      sameSite: "lax",
      httpOnly: true,
      maxAge: 90 * DAY,
    });
  });

  it("renews a session more than a day old, keeping who it is and what it may do", async () => {
    const renewed = await renewedAdminToken(
      await token(session, now() + ADMIN_SESSION_TTL_SECONDS - 2 * DAY),
    );
    expect(renewed).not.toBeNull();
    const next = decodeJwt(renewed!);
    expect(next).toMatchObject({ ...session, sub: "a1", iat: 1 });
    expect(next.exp!).toBeGreaterThan(now() + ADMIN_SESSION_TTL_SECONDS - 60);
  });

  it("leaves a session renewed today alone", async () => {
    expect(
      await renewedAdminToken(
        await token(session, now() + ADMIN_SESSION_TTL_SECONDS - 60),
      ),
    ).toBeNull();
  });

  it("never renews a missing, expired or forged session", async () => {
    expect(await renewedAdminToken(undefined)).toBeNull();
    expect(await renewedAdminToken(await token(session, now() - 1))).toBeNull();
    expect(
      await renewedAdminToken(
        await token(session, now() + DAY, "x".repeat(40)),
      ),
    ).toBeNull();
  });
});
