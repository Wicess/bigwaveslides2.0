"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { notifyContact } from "@/lib/notifications";
import { rateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  subject: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(10).max(4000),
  locale: z.string().default("en"),
  // Honeypot — bots fill this; humans never see it.
  website: z.string().optional(),
});

export type ContactResult = { ok: boolean; error?: string };

export async function submitContact(
  input: z.input<typeof schema>,
): Promise<ContactResult> {
  // Silently accept (and drop) honeypot submissions.
  if (input.website) return { ok: true };

  // Anti-spam: 5 messages per IP per 10 minutes.
  const limit = rateLimit(
    clientKeyFromHeaders(await headers(), "contact"),
    5,
    10 * 60 * 1000,
  );
  if (!limit.ok) {
    return {
      ok: false,
      error: "Please wait a moment before sending another message.",
    };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const { name, email, phone, subject, message, locale } = parsed.data;

  try {
    await prisma.contactInquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        locale,
        sourcePage: "contact",
      },
    });
    await notifyContact({
      name,
      email,
      subject: subject || undefined,
      message,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
