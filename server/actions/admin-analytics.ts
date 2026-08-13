"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logActivity } from "@/lib/admin-auth";
import { parseUserAgent } from "@/lib/analytics/geo";

export type AdminActionResult = { ok: boolean; error?: string };

const schema = z.object({
  id: z.string().min(1),
  isBot: z.boolean(),
});

/**
 * Manually reclassify a visitor as a bot, or restore it to a real device.
 *
 * Automatic detection covers the clear cases — a self-identifying crawler UA, a
 * malformed Chromium token, or a datacenter IP on first sight. What it cannot
 * settle is the middle ground: a crawler running a stock desktop UA from a
 * residential-looking range looks exactly like a person who landed once and
 * left. Guessing there costs a real visitor their place in the list, so the call
 * belongs to whoever is reading the dashboard.
 *
 * Marking a visitor writes `device = "BOT"`, which is the same field the list
 * filters on — so a marked visitor disappears from "Human visitors" and appears
 * under "Show bots" immediately, with no extra schema or second source of truth.
 * Restoring re-derives the device from the stored user agent rather than
 * assuming desktop.
 */
export async function setVisitorIsBot(input: {
  id: string;
  isBot: boolean;
}): Promise<AdminActionResult> {
  // Gated the same way the analytics pages themselves are — requireAdmin only.
  // A finer permission here would lock out admins who can see the page but not
  // act on it, which is a worse outcome than the page and its one control
  // sharing a gate.
  const session = await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  const { id, isBot } = parsed.data;

  try {
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      select: { id: true, visitorKey: true, userAgent: true },
    });
    if (!visitor) return { ok: false, error: "Visitor not found." };

    // Restoring: re-parse the UA so we put back what it actually was. If the UA
    // itself is what flagged it, parseUserAgent returns BOT again — which is the
    // honest answer, and the admin can see the mark didn't stick for a reason.
    const device = isBot
      ? ("BOT" as const)
      : parseUserAgent(visitor.userAgent).device;

    await prisma.visitor.update({ where: { id }, data: { device } });

    await logActivity(
      session.id,
      isBot ? "visitor.mark_bot" : "visitor.unmark_bot",
      {
        entityType: "Visitor",
        entityId: visitor.id,
        summary: `${isBot ? "Marked" : "Restored"} visitor #${visitor.visitorKey.slice(0, 8)}${isBot ? " as a bot" : ` to ${device.toLowerCase()}`}`,
      },
    );

    revalidatePath("/admin/analytics/visitors");
    revalidatePath(`/admin/analytics/visitors/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update this visitor." };
  }
}
