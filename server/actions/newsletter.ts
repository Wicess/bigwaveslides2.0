"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyNewsletterSignup } from "@/lib/notifications";

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
