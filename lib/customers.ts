// lib/customers.ts
// -----------------------------------------------------------------------------
// Automatic customer accounts. Whenever a guest places an order, requests a
// booking, or asks for a quote, we find-or-create their Customer record by
// email and link the new document to it — so every order, quote, invoice,
// pending payment, and newsletter subscription accumulates on one account
// (visible in Admin → Customers). Best-effort by design: an account hiccup
// must never block a checkout.
// -----------------------------------------------------------------------------
import "server-only";
import { prisma } from "@/lib/prisma";

export async function upsertCustomerFromGuest(g: {
  name: string;
  email: string;
  phone?: string | null;
  locale?: string;
}): Promise<string | null> {
  try {
    const email = g.email.trim().toLowerCase();
    if (!email) return null;
    // Newsletter status folds into the account as marketing opt-in.
    const subscribed = await prisma.newsletterSubscriber
      .findFirst({
        where: { email: { equals: email, mode: "insensitive" }, status: "SUBSCRIBED" },
        select: { id: true },
      })
      .catch(() => null);
    const c = await prisma.customer.upsert({
      where: { email },
      update: {
        // Keep contact details fresh on every touch.
        name: g.name,
        ...(g.phone ? { phone: g.phone } : {}),
        ...(subscribed ? { marketingOptIn: true } : {}),
      },
      create: {
        email,
        name: g.name,
        phone: g.phone ?? null,
        locale: g.locale ?? "en",
        marketingOptIn: Boolean(subscribed),
      },
      select: { id: true },
    });
    return c.id;
  } catch (e) {
    console.error("[customers] upsert failed:", e);
    return null;
  }
}

/** Add a paid order's total to the customer's lifetime value (best-effort). */
export async function addToLifetimeValue(
  customerId: string | null | undefined,
  cents: number,
): Promise<void> {
  if (!customerId || cents <= 0) return;
  await prisma.customer
    .update({
      where: { id: customerId },
      data: { lifetimeValueCents: { increment: cents } },
    })
    .catch(() => {});
}
