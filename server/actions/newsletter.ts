"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: { status: "SUBSCRIBED" },
      create: {
        email: parsed.data.email,
        locale: parsed.data.locale,
        source: parsed.data.source,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Subscription failed" };
  }
}
