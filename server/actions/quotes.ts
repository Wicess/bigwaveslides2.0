"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { quoteNumber } from "@/lib/ref-number";
import { notifyQuoteRequest } from "@/lib/notifications";

const CONTEXTS = ["SHOP", "RENTAL", "SERVICE", "GENERAL"] as const;

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
  message: z.string().min(5).max(4000),
  context: z.enum(CONTEXTS).default("GENERAL"),
  productId: z.string().optional(),
  productLabel: z.string().max(200).optional(),
  locale: z.string().default("en"),
  website: z.string().optional(), // honeypot
});

export type QuoteResult =
  | { ok: true; quoteNumber: string }
  | { ok: false; error: string };

/** Capture a general / product / service quote request (request-based flow). */
export async function createQuoteRequest(
  input: z.input<typeof schema>,
): Promise<QuoteResult> {
  if (input.website) {
    return { ok: true, quoteNumber: quoteNumber() };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const data = parsed.data;

  try {
    const eventDate = data.eventDate ? new Date(data.eventDate) : null;
    const quote = await prisma.quoteRequest.create({
      data: {
        quoteNumber: quoteNumber(),
        guestName: data.name,
        guestEmail: data.email,
        guestPhone: data.phone || null,
        status: "NEW",
        context: data.context,
        eventDate: eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate : null,
        message: data.message,
        locale: data.locale,
        ...(data.productId || data.productLabel
          ? {
              items: {
                create: {
                  productId: data.productId ?? null,
                  label: data.productLabel ?? "Product enquiry",
                  quantity: 1,
                },
              },
            }
          : {}),
      },
      select: { quoteNumber: true },
    });

    await notifyQuoteRequest({
      quoteNumber: quote.quoteNumber,
      name: data.name,
      email: data.email,
    });
    return { ok: true, quoteNumber: quote.quoteNumber };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
