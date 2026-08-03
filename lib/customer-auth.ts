import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

/*
 * Passwordless customer sessions.
 *
 * Two ways a browser becomes "signed in" as a customer — both proof-based, no
 * password ever:
 *   1. Same device — the moment they place an order/booking/quote we set a
 *      long-lived signed cookie. They stay signed in on that browser.
 *   2. Any other device — opening one of their secure order links (which we
 *      only ever email to them) signs THAT browser in, because reaching the
 *      link is proof they own the inbox. See claimCustomerSession().
 *
 * Deliberately NOT tied to IP address: carrier-grade NAT means thousands of
 * strangers share one IP, so IP-based auth would sign people into each other's
 * accounts. The cookie is the identity, scoped to the browser that earned it.
 */

export const CUSTOMER_COOKIE = "bws_customer";
// Readable (NOT httpOnly) companion cookie holding just the customer's first
// name. It lets the public navbar render a signed-in profile avatar without a
// DB read or a dynamic render on every page — the identity/authorization still
// lives entirely in the signed CUSTOMER_COOKIE above.
export const CUSTOMER_NAME_COOKIE = "bws_name";
const SESSION_DAYS = 365;

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-production",
  );
}

/** Issue (or refresh) the signed customer cookie on the current browser.
    `displayName` avoids a DB read; when omitted we look the name up once (this
    only runs at order/booking/quote placement or first cross-device claim, so
    it's never a per-page-view cost). */
export async function createCustomerSession(
  customerId: string,
  displayName?: string,
): Promise<void> {
  const token = await new SignJWT({ kind: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());

  const store = await cookies();
  const cookieBase = {
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
  store.set(CUSTOMER_COOKIE, token, { ...cookieBase, httpOnly: true });

  // Companion display cookie (readable by the client navbar). Falls back to a
  // single cheap lookup when the caller doesn't already have the name.
  let name = displayName;
  if (name === undefined) {
    name =
      (
        await prisma.customer
          .findUnique({ where: { id: customerId }, select: { name: true } })
          .catch(() => null)
      )?.name ?? "";
  }
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  store.set(CUSTOMER_NAME_COOKIE, encodeURIComponent(first), {
    ...cookieBase,
    httpOnly: false,
  });
}

export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
  store.delete(CUSTOMER_NAME_COOKIE);
}

/** The signed-in customer's id, or null. Verifies the cookie signature. */
export async function getCustomerId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
}

/** Load the full signed-in customer with all their history, or null. */
export async function getCurrentCustomer() {
  const id = await getCustomerId();
  if (!id) return null;
  return prisma.customer
    .findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" } },
        bookings: { orderBy: { createdAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" } },
      },
    })
    .catch(() => null);
}
