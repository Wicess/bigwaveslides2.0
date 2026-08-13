"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";
import { notifyStatusUpdate } from "@/lib/notifications";
import { statusLabel } from "@/lib/status-labels";

const ORDER_STATUS = [
  "PENDING",
  "PROCESSING",
  "FULFILLED",
  "CANCELLED",
] as const;
const PAYMENT_STATUS = [
  "PENDING",
  "INVOICE_SENT",
  "DEPOSIT_PAID",
  "PAID_IN_FULL",
  "CANCELLED",
] as const;

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(ORDER_STATUS),
  paymentStatus: z.enum(PAYMENT_STATUS),
  invoiceNote: z.string().max(2000).optional().or(z.literal("")),
});

export type AdminActionResult = { ok: boolean; error?: string };

type UpdateOrderInput = {
  id: string;
  status: string;
  paymentStatus: string;
  invoiceNote?: string;
};

export async function updateOrder(
  input: UpdateOrderInput,
): Promise<AdminActionResult> {
  const session = await requirePermission("order.update");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  const { id, status, paymentStatus, invoiceNote } = parsed.data;

  try {
    const data: {
      status: (typeof ORDER_STATUS)[number];
      paymentStatus: (typeof PAYMENT_STATUS)[number];
      invoiceNote: string | null;
      paidAt?: Date;
    } = { status, paymentStatus, invoiceNote: invoiceNote || null };
    if (paymentStatus === "PAID_IN_FULL") data.paidAt = new Date();

    const updated = await prisma.order.update({
      where: { id },
      data,
      select: { orderNumber: true, guestName: true, guestEmail: true },
    });
    await logActivity(session.id, "order.update", {
      entityType: "Order",
      entityId: id,
      summary: `Order set to ${status} / ${paymentStatus}`,
    });

    if (updated.guestEmail) {
      await notifyStatusUpdate({
        email: updated.guestEmail,
        name: updated.guestName ?? "there",
        reference: updated.orderNumber,
        kind: "order",
        statusLabel: `${statusLabel(status)} · ${statusLabel(paymentStatus)}`,
        note: invoiceNote || undefined,
      });
    }

    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the order." };
  }
}

/** Permanently delete an order (line items cascade). */
export async function deleteOrder(id: string): Promise<AdminActionResult> {
  const session = await requirePermission("order.update");
  try {
    const order = await prisma.order.delete({
      where: { id },
      select: { orderNumber: true },
    });
    await logActivity(session.id, "order.delete", {
      entityType: "Order",
      entityId: id,
      summary: `Order ${order.orderNumber} deleted`,
    });
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete the order." };
  }
}
