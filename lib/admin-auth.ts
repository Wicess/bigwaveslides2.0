import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  adminSessionCookieOptions,
  adminSessionSecret,
} from "@/lib/admin-session-policy";

export { ADMIN_COOKIE };

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Permission keys; SUPER_ADMIN implicitly has all. */
  perms: string[];
  superAdmin: boolean;
};

// 90 days, renewed by middleware while the device is in use; see
// lib/admin-session-policy.ts.
const secret = adminSessionSecret;

export async function createAdminSession(payload: AdminSession): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
    )
    .sign(secret());

  const store = await cookies();
  // Lax, not Strict: a tap on an ntfy notification opens the admin from
  // another app, and Strict cookies are not sent then.
  store.set(ADMIN_COOKIE, token, adminSessionCookieOptions());
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/** Read & verify the admin session, or null. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.sub),
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: String(payload.role ?? ""),
      perms: Array.isArray(payload.perms) ? (payload.perms as string[]) : [],
      superAdmin: payload.superAdmin === true,
    };
  } catch {
    return null;
  }
}

/** Guard for admin pages — redirects to login when unauthenticated. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export function can(session: AdminSession, permission: string): boolean {
  return session.superAdmin || session.perms.includes(permission);
}

/** Guard requiring a specific permission. */
export async function requirePermission(
  permission: string,
): Promise<AdminSession> {
  const session = await requireAdmin();
  if (!can(session, permission)) redirect("/admin");
  return session;
}

/** Append an audit-trail entry. Best-effort; never throws into the caller. */
export async function logActivity(
  actorId: string,
  action: string,
  opts: {
    entityType?: string;
    entityId?: string;
    summary?: string;
    diff?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      hdrs.get("x-real-ip") ??
      null;
    await prisma.activityLog.create({
      data: {
        actorId,
        action,
        entityType: opts.entityType ?? null,
        entityId: opts.entityId ?? null,
        summary: opts.summary ?? null,
        diff: (opts.diff as Prisma.InputJsonValue) ?? undefined,
        ip,
      },
    });
  } catch {
    /* non-fatal */
  }
}
