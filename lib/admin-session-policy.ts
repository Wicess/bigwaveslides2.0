import { SignJWT, jwtVerify } from "jose";

/**
 * How long an admin sign-in lasts, shared by the code that issues the session
 * (lib/admin-auth.ts) and the middleware that renews it. No server-only
 * imports, so the edge middleware can use it.
 *
 * Owner: once signed in on a device, stay signed in — including when an admin
 * link is opened by tapping an ntfy notification.
 *
 *  - The session lasts 90 days and RENEWS itself: any admin request with a
 *    valid session more than a day old gets the same session re-signed with a
 *    fresh 90 days. Identity, role, permissions and superAdmin are carried over
 *    unchanged — renewal extends a session, it never widens one. A device left
 *    alone for 90 days has to sign in again.
 *  - The cookie is SameSite=Lax, not Strict: Strict cookies are not sent when
 *    the admin is opened from another app (a notification tap), so every tap
 *    would land on the sign-in page. Lax still withholds the cookie from
 *    cross-site form posts, and Next checks the origin of every server action.
 *
 * To sign every device out at once, rotate NEXTAUTH_SECRET (the key that signs
 * these tokens): every outstanding session stops verifying. Signing out on a
 * device clears that device. A permission change takes effect at next sign-in.
 */
export const ADMIN_COOKIE = "bws_admin";
export const ADMIN_SESSION_TTL_SECONDS = 90 * 24 * 60 * 60;
/** Renew at most once a day per device, so renewal is not a cookie write on every click. */
export const ADMIN_SESSION_RENEW_AFTER_SECONDS = 24 * 60 * 60;

export function adminSessionSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-production",
  );
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}

/**
 * A re-signed session token for an admin who is using the panel, or null when
 * none is due (missing, forged, expired, or renewed within the last day).
 */
export async function renewedAdminToken(
  token: string | undefined,
  nowMs: number = Date.now(),
): Promise<string | null> {
  if (!token) return null;
  try {
    const now = Math.floor(nowMs / 1000);
    const { payload } = await jwtVerify(token, adminSessionSecret(), {
      algorithms: ["HS256"],
      currentDate: new Date(nowMs),
    });
    if (typeof payload.exp !== "number" || payload.exp <= now) return null;
    if (
      payload.exp - now >
      ADMIN_SESSION_TTL_SECONDS - ADMIN_SESSION_RENEW_AFTER_SECONDS
    ) {
      return null;
    }
    return await new SignJWT({
      ...payload,
      exp: now + ADMIN_SESSION_TTL_SECONDS,
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(adminSessionSecret());
  } catch {
    return null;
  }
}
