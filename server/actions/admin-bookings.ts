"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";

const BOOKING_STATUS = ["REQUESTED", "CONFIRMED", "COMPLETED", "DECLINED", "CANCELLED"] as const;
const PAYMENT_STATUS = ["PENDING", "INVOICE_SENT", "DEPOSIT_PAID", "PAID_IN_FULL", "CANCELLED"] as const;

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(BOOKING_STATUS),
  paymentStatus: z.enum(PAYMENT_STATUS),
  invoiceNote: z.string().max(2000).optional().or(z.literal("")),
});

export type AdminActionResult = { ok: boolean; error?: string };

type UpdateBookingInput = {
  id: string;
  status: string;
  paymentStatus: string;
  invoiceNote?: string;
};

/**
 * Update a booking. Confirming converts the TENTATIVE hold to a HARD hold (which
 * blocks the availability calendar) and advances a DRAFT contract to SENT.
 * Declining/cancelling releases the hold back to TENTATIVE.
 */
export async function updateBooking(input: UpdateBookingInput): Promise<AdminActionResult> {
  const session = await requirePermission("booking.confirm");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  const { id, status, paymentStatus, invoiceNote } = parsed.data;

  try {
    const holdType = status === "CONFIRMED" || status === "COMPLETED" ? "HARD" : "TENTATIVE";

    await prisma.booking.update({
      where: { id },
      data: {
        status,
        paymentStatus,
        holdType,
        invoiceNote: invoiceNote || null,
        ...(paymentStatus === "PAID_IN_FULL" ? { paidAt: new Date() } : {}),
      },
    });

    // Advance the contract when the booking is confirmed.
    if (status === "CONFIRMED") {
      await prisma.rentalContract.updateMany({
        where: { bookingId: id, status: "DRAFT" },
        data: { status: "SENT" },
      });
    }

    await logActivity(session.id, "booking.update", {
      entityType: "Booking",
      entityId: id,
      summary: `Booking set to ${status} (${holdType} hold)`,
    });
    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the booking." };
  }
}
