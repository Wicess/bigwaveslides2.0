import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendAbandonedCartReminder } from "@/lib/notifications";
import { getLocalized } from "@/lib/localized";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Carts idle longer than this are considered abandoned.
const IDLE_HOURS = 24;

/**
 * Abandoned-cart recovery sweep. Finds stale ACTIVE carts that still hold items
 * and, for those linked to a known customer, emails a personalized reminder
 * with the items they left + a 10% comeback code (COMEBACK10). The cart is left
 * ACTIVE so the customer can still check out when they return; `reminderSentAt`
 * makes it idempotent (one email per cart). Triggered by Vercel Cron (GET),
 * which sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
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
      select: {
        id: true,
        customerId: true,
        items: {
          select: {
            quantity: true,
            mode: true,
            product: { select: { name: true } },
          },
        },
      },
      take: 200,
    });

    if (stale.length === 0) {
      return NextResponse.json({ swept: 0, reminded: 0 });
    }

    // Mark handled (idempotency) but KEEP status ACTIVE so a returning customer
    // can still complete checkout.
    const ids = stale.map((c) => c.id);
    await prisma.cart.updateMany({
      where: { id: { in: ids } },
      data: { reminderSentAt: new Date() },
    });

    // Cart has customerId but no relation field — look the customers up.
    const customerIds = [
      ...new Set(
        stale.map((c) => c.customerId).filter((v): v is string => !!v),
      ),
    ];
    const customers = customerIds.length
      ? await prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, email: true, name: true, locale: true },
        })
      : [];
    const byId = new Map(customers.map((c) => [c.id, c]));

    let reminded = 0;
    for (const cart of stale) {
      const cust = cart.customerId ? byId.get(cart.customerId) : null;
      if (!cust?.email) continue; // guests have no address to reach
      const items = cart.items.map((i) => ({
        name: getLocalized(i.product.name, cust.locale ?? "en"),
        quantity: i.quantity,
        mode: i.mode === "RENT" ? ("RENT" as const) : ("BUY" as const),
      }));
      await sendAbandonedCartReminder({
        email: cust.email,
        name: cust.name,
        items,
      }).catch((e) => console.error("[cron] cart reminder failed", cart.id, e));
      reminded += 1;
    }

    return NextResponse.json({ swept: ids.length, reminded });
  } catch {
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
