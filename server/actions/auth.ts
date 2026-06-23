"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { getCartCookie } from "@/lib/cart-session";

export type AuthResult = { ok: boolean; error?: string };

function resetSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-production",
  );
}

/** Attach the current guest cart to a customer after they authenticate. */
async function claimGuestCart(customerId: string) {
  try {
    const cartId = await getCartCookie();
    if (!cartId) return;
    await prisma.cart.updateMany({
      where: { id: cartId, status: "ACTIVE", customerId: null },
      data: { customerId },
    });
  } catch {
    /* non-fatal */
  }
}

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters"),
  marketingOptIn: z.boolean().optional(),
  locale: z.string().default("en"),
});

export async function registerCustomer(
  input: z.input<typeof registerSchema>,
): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const { name, email, password, marketingOptIn, locale } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return { ok: false, error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = await prisma.customer.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        marketingOptIn: marketingOptIn ?? false,
        locale,
      },
      select: { id: true },
    });

    await claimGuestCart(customer.id);
    await signIn("credentials", { email: normalizedEmail, password, redirect: false });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Account created — please sign in." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signInWithCredentials(
  input: z.input<typeof signInSchema>,
): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please enter your email and password." };
  }
  const email = parsed.data.email.toLowerCase().trim();

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirect: false });
    const customer = await prisma.customer.findUnique({
      where: { email },
      select: { id: true },
    });
    if (customer) await claimGuestCart(customer.id);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

const forgotSchema = z.object({ email: z.string().email() });

/**
 * Generate a short-lived, stateless reset token (HS256 via jose). The token is
 * emailed to the customer in Phase 17 (SMTP). We always return success so the
 * endpoint never reveals whether an email is registered.
 */
export async function requestPasswordReset(
  input: z.input<typeof forgotSchema>,
): Promise<AuthResult> {
  const parsed = forgotSchema.safeParse(input);
  if (!parsed.success) return { ok: true };

  const email = parsed.data.email.toLowerCase().trim();
  try {
    const customer = await prisma.customer.findUnique({
      where: { email },
      select: { id: true },
    });
    if (customer) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _token = await new SignJWT({ purpose: "pwreset" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(customer.id)
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(resetSecret());
      // TODO(Phase 17): email `${SITE_URL}/reset-password?token=${_token}`.
    }
  } catch {
    /* ignore — never leak */
  }
  return { ok: true };
}

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function resetPassword(
  input: z.input<typeof resetSchema>,
): Promise<AuthResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  try {
    const { payload } = await jwtVerify(parsed.data.token, resetSecret());
    if (payload.purpose !== "pwreset" || !payload.sub) {
      return { ok: false, error: "This reset link is invalid or has expired." };
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.customer.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }
}
