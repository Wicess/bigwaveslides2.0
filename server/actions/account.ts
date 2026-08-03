"use server";

import { prisma } from "@/lib/prisma";
import {
  createCustomerSession,
  destroyCustomerSession,
  getCustomerId,
} from "@/lib/customer-auth";

/*
 * Cross-device passwordless sign-in. When a customer opens one of their secure
 * order links (only ever emailed to them), the order page calls this on mount.
 * Reaching the link is proof they own the inbox, so we sign that browser into
 * the order's customer account. No-op if the order has no linked customer or
 * the browser is already signed in as that same customer.
 */
export async function claimAccountFromOrder(
  orderNumber: string,
): Promise<{ ok: boolean }> {
  if (!orderNumber) return { ok: false };
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { customerId: true, guestName: true },
    });
    if (!order?.customerId) return { ok: false };
    const current = await getCustomerId();
    if (current === order.customerId) return { ok: true };
    await createCustomerSession(order.customerId, order.guestName ?? undefined);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function signOutCustomer(): Promise<void> {
  await destroyCustomerSession();
}
