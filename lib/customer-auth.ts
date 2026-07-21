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
const SESSION_DAYS = 365;

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-production",
  );
}

/** Issue (or refresh) the signed customer cookie on the current browser. */
export async function createCustomerSession(customerId: string): Promise<void> {
  const token = await new SignJWT({ kind: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());

  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
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
