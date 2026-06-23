import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Carts idle longer than this are considered abandoned.
const IDLE_HOURS = 24;

/**
 * Abandoned-request recovery sweep. Flags stale ACTIVE carts (that still hold
 * items) as ABANDONED so a reminder can be sent. The actual reminder email is
 * wired in Phase 17 (SMTP); this endpoint marks `reminderSentAt` to make the
 * job idempotent. Trigger from Vercel Cron with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - IDLE_HOURS * 60 * 60 * 1000);

  try {
    const stale = await prisma.cart.findMany({
      where: {
        status: "ACTIVE",
        lastActivityAt: { lt: cutoff },
        reminderSentAt: null,
        items: { some: {} },
      },
      select: { id: true },
      take: 200,
    });

    if (stale.length === 0) {
      return NextResponse.json({ flagged: 0, reminded: 0 });
    }

    const ids = stale.map((c) => c.id);
    await prisma.cart.updateMany({
      where: { id: { in: ids } },
      data: { status: "ABANDONED", reminderSentAt: new Date() },
    });

    // TODO(Phase 17): enqueue reminder emails for these carts.
    return NextResponse.json({ flagged: ids.length, reminded: 0 });
  } catch {
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
