"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";

const QUOTE_STATUS = ["NEW", "REVIEWED", "QUOTED", "WON", "LOST"] as const;

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(QUOTE_STATUS),
  estimate: z.string().optional(), // dollars, optional
  staffNotes: z.string().max(2000).optional().or(z.literal("")),
});

export type AdminActionResult = { ok: boolean; error?: string };

type UpdateQuoteInput = {
  id: string;
  status: string;
  estimate?: string;
  staffNotes?: string;
};

export async function updateQuote(input: UpdateQuoteInput): Promise<AdminActionResult> {
  const session = await requirePermission("quote.update");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  const { id, status, estimate, staffNotes } = parsed.data;

  const estimateCents =
    estimate && estimate.trim() !== ""
      ? Math.round(Number(estimate) * 100)
      : null;
  if (estimate && Number.isNaN(estimateCents)) {
    return { ok: false, error: "Estimate must be a number." };
  }

  try {
    await prisma.quoteRequest.update({
      where: { id },
      data: {
        status,
        estimateCents: estimateCents ?? undefined,
        staffNotes: staffNotes || null,
      },
    });
    await logActivity(session.id, "quote.update", {
      entityType: "QuoteRequest",
      entityId: id,
      summary: `Quote set to ${status}`,
    });
    revalidatePath(`/admin/quotes/${id}`);
    revalidatePath("/admin/quotes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the quote." };
  }
}
