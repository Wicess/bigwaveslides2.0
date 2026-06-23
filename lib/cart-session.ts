import "server-only";
import { cookies } from "next/headers";

export const CART_COOKIE = "bws_cart";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Read the current cart id from the session cookie (read-only contexts). */
export async function getCartCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Persist the cart id to the session cookie (server actions / route handlers). */
export async function setCartCookie(id: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearCartCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
