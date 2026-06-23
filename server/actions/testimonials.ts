"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  authorName: z.string().min(2).max(80),
  authorRole: z.string().max(120).optional().or(z.literal("")),
  organization: z.string().max(120).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().min(10).max(1000),
  locale: z.string().default("en"),
  website: z.string().optional(), // honeypot
});

export type TestimonialResult = { ok: boolean; error?: string };

/** Submit a testimonial — held PENDING for moderation in the admin (Phase 16). */
export async function submitTestimonial(
  input: z.input<typeof schema>,
): Promise<TestimonialResult> {
  if (input.website) return { ok: true };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your testimonial and try again." };
  }
  const { authorName, authorRole, organization, rating, quote, locale } = parsed.data;

  try {
    await prisma.testimonial.create({
      data: {
        authorName,
        authorRole: authorRole || null,
        organization: organization || null,
        rating,
        // Localized Json — store under the submitter's locale.
        quote: { [locale]: quote },
        status: "PENDING",
      },
    });
    revalidateTag("testimonials");
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
