"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyNewsletterSignup } from "@/lib/notifications";
import { readUnsubscribeToken } from "@/lib/newsletter-token";

const schema = z.object({
  email: z.string().email(),
  locale: z.string().default("en"),
  source: z.string().default("footer"),
});

export type SubscribeResult = { ok: boolean; error?: string };

/** Subscribe an email to the newsletter (idempotent). */
export async function subscribeNewsletter(input: {
  email: string;
  locale?: string;
  source?: string;
}): Promise<SubscribeResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid email address" };
  }

  try {
    // Detect whether this is a brand-new (or re-activated) subscription so we
    // only fire the welcome/admin emails when it's meaningful.
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: parsed.data.email },
      select: { status: true },
    });
    const isNew = !existing || existing.status !== "SUBSCRIBED";

    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: { status: "SUBSCRIBED" },
      create: {
        email: parsed.data.email,
        locale: parsed.data.locale,
        source: parsed.data.source,
      },
    });

    // Fold the subscription into the customer's account when one exists.
    await prisma.customer
      .updateMany({
        where: { email: { equals: parsed.data.email, mode: "insensitive" } },
        data: { marketingOptIn: true },
      })
      .catch(() => {});

    if (isNew) {
      // Best-effort: never fail the subscription if email sending hiccups.
      await notifyNewsletterSignup({
        email: parsed.data.email,
        locale: parsed.data.locale,
      }).catch(() => {});
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Subscription failed" };
  }
}

/**
 * Opt an address out, from the signed link in an email footer.
 *
 * The mirror image of subscribeNewsletter, and it has to be: subscribing sets
 * `marketingOptIn` on the customer record and unlocks a 15% loyalty discount at
 * checkout, so an opt-out that only flipped the newsletter row would leave the
 * customer still flagged as opted-in and still being given the discount. Both
 * places are cleared here.
 *
 * Idempotent. People click these links twice, and mail clients pre-fetch them.
 */
export async function unsubscribeNewsletter(input: {
  token: string;
  via?: string;
}): Promise<{ ok: boolean; email?: string; error?: string }> {
  const email = await readUnsubscribeToken(input.token);
  if (!email) return { ok: false, error: "This link is invalid or expired." };

  try {
    // updateMany, not update: an address with no row is already not subscribed,
    // and that should read as success rather than "not found".
    await prisma.newsletterSubscriber.updateMany({
      where: { email: { equals: email, mode: "insensitive" } },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        unsubscribedVia: input.via ?? "email-link",
      },
    });
    await prisma.customer
      .updateMany({
        where: { email: { equals: email, mode: "insensitive" } },
        data: { marketingOptIn: false },
      })
      .catch(() => {});
    return { ok: true, email };
  } catch {
    return { ok: false, error: "Could not process that right now." };
  }
}
