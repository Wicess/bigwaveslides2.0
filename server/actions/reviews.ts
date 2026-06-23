"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string().min(1),
  authorName: z.string().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(10).max(2000),
  // Honeypot — bots fill this; humans never see it.
  website: z.string().optional(),
});

export type ReviewResult = { ok: boolean; error?: string };

export async function submitReview(
  input: z.input<typeof schema>,
): Promise<ReviewResult> {
  if (input.website) return { ok: true };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your review and try again." };
  }
  const { productId, authorName, rating, title, body } = parsed.data;

  try {
    // Reviews are held for moderation (PENDING) and approved in the admin (Phase 16).
    await prisma.review.create({
      data: {
        productId,
        authorName,
        rating,
        title: title || null,
        body,
        status: "PENDING",
      },
    });
    revalidateTag("products");
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
