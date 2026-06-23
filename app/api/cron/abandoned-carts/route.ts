import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendAbandonedCartReminder } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Carts idle longer than this are considered abandoned.
const IDLE_HOURS = 24;

/**
 * Abandoned-request recovery sweep. Flags stale ACTIVE carts (that still hold
 * items) as ABANDONED and emails a reminder to carts linked to a customer.
 * Idempotent via `reminderSentAt`. Triggered by Vercel Cron (GET), which sends
 * `Authorization: Bearer <CRON_SECRET>` automatically when CRON_SECRET is set.
 */
export async function GET(request: Request) {
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
      select: { id: true, customerId: true },
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

    // Email reminders only to carts linked to a known customer (guests have none).
    const customerIds = stale.map((c) => c.customerId).filter((v): v is string => !!v);
    let reminded = 0;
    if (customerIds.length > 0) {
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { email: true },
      });
      for (const c of customers) {
        await sendAbandonedCartReminder(c.email);
        reminded += 1;
      }
    }

    return NextResponse.json({ flagged: ids.length, reminded });
  } catch {
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
