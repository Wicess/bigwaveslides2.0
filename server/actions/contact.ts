"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
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
    // Email notification + auto-reply are wired in Phase 17 (Hostinger SMTP).
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
