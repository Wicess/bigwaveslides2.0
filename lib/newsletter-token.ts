import "server-only";
import { SignJWT, jwtVerify } from "jose";

/*
 * Signed one-click unsubscribe links.
 *
 * The token carries the email address and is signed, so the link works from any
 * device with no login — which is the point, since the person clicking it is
 * usually not signed in and should not have to be. Signing is what stops the
 * obvious abuse: an unsigned `?email=` parameter would let anyone unsubscribe
 * anyone else by editing the URL.
 *
 * Long-lived on purpose. An unsubscribe link has to keep working in an email
 * someone finds months later — US CAN-SPAM requires the opt-out to function for
 * at least 30 days after the message was sent, and a person who digs up an old
 * email to get off the list is exactly who this is for. There is nothing
 * sensitive behind the token: the worst it can do is stop mail.
 */

const TWO_YEARS = "730d";

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-production",
  );
}

/** Signed token identifying the address to unsubscribe. */
export async function signUnsubscribeToken(email: string): Promise<string> {
  return new SignJWT({ kind: "unsubscribe" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email.trim().toLowerCase())
    .setIssuedAt()
    .setExpirationTime(TWO_YEARS)
    .sign(secret());
}

/** The address a token unsubscribes, or null if it is invalid or expired. */
export async function readUnsubscribeToken(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "unsubscribe") return null;
    const email = typeof payload.sub === "string" ? payload.sub : "";
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

/** Absolute unsubscribe URL to drop into an email footer. */
export async function unsubscribeUrl(
  email: string,
  origin: string,
): Promise<string> {
  const token = await signUnsubscribeToken(email);
  return `${origin.replace(/\/+$/, "")}/en/unsubscribe?t=${encodeURIComponent(token)}`;
}
