"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalized } from "@/lib/localized";
import { rentalDays, computeQuote, parseISODate } from "@/lib/rental-pricing";
import { checkRange } from "@/server/data/availability";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { bookingNumber, contractNumber } from "@/lib/ref-number";
import { notifyBookingRequest } from "@/lib/notifications";
import { upsertCustomerFromGuest } from "@/lib/customers";

const schema = z.object({
  productId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  address: z.string().min(3).max(300),
  city: z.string().min(2).max(120),
  eventType: z.string().max(120).optional().or(z.literal("")),
  headcount: z.coerce.number().int().min(0).max(100000).optional(),
  surfaceType: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  locale: z.string().default("en"),
  website: z.string().optional(), // honeypot
});

export type BookingResult =
  | { ok: true; bookingNumber: string; contractNumber: string }
  | { ok: false; error: string };

/**
 * Create a request-based rental Booking with a TENTATIVE hold (never blocks the
 * calendar for others — only admin confirmation makes it a HARD hold), plus a
 * DRAFT digital contract ready for the customer to e-sign. No payment is taken.
 */
export async function createBookingRequest(
  input: z.input<typeof schema>,
): Promise<BookingResult> {
  if (input.website) {
    return { ok: true, bookingNumber: bookingNumber(), contractNumber: contractNumber() };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const d = parsed.data;

  const start = parseISODate(d.startDate);
  const end = parseISODate(d.endDate);
  if (!start || !end || end < start) {
    return { ok: false, error: "Please choose a valid date range." };
  }

  try {
    const product = await prisma.product.findFirst({
      where: { id: d.productId, status: "ACTIVE", type: { in: ["RENTAL", "BOTH"] } },
      select: {
        id: true,
        name: true,
        dailyRateCents: true,
        depositCents: true,
        media: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });
    if (!product) return { ok: false, error: "This rental is unavailable." };

    // Re-check availability server-side (defensive — the client also checks).
    const availability = await checkRange(d.productId, d.startDate, d.endDate);
    if (!availability.available) {
      return {
        ok: false,
        error: "Those dates are no longer available. Please choose other dates.",
      };
    }

    const settings = await getSettings().catch((): SiteSettings => ({}));
    const fees = settings.fees ?? {};
    const days = rentalDays(d.startDate, d.endDate);
    const dailyRate = product.dailyRateCents ?? 0;
    const quote = computeQuote({
      dailyRateCents: dailyRate,
      depositCents: product.depositCents,
      deliveryBaseCents: fees.deliveryBaseCents,
      pickupCents: fees.pickupCents,
      days,
    });
    const name = getLocalized(product.name, d.locale);

    // Auto-create/refresh the customer's account and attach this booking.
    const customerId = await upsertCustomerFromGuest({
      name: d.name,
      email: d.email,
      phone: d.phone,
      locale: d.locale,
    });

    const created = await prisma.booking.create({
      data: {
        bookingNumber: bookingNumber(),
        ...(customerId ? { customerId } : {}),
        guestName: d.name,
        guestEmail: d.email,
        guestPhone: d.phone,
        status: "REQUESTED",
        paymentStatus: "PENDING",
        holdType: "TENTATIVE",
        eventStartDate: start,
        eventEndDate: end,
        eventType: d.eventType || null,
        headcount: d.headcount ?? null,
        surfaceType: d.surfaceType || null,
        eventAddress: { address: d.address, city: d.city },
        subtotalCents: quote.rentalCents,
        deliveryFeeCents: fees.deliveryBaseCents ?? 0,
        pickupFeeCents: fees.pickupCents ?? 0,
        depositCents: quote.depositCents,
        totalCents: quote.totalCents,
        balanceDueCents: quote.totalCents,
        locale: d.locale,
        notes: d.notes || null,
        items: {
          create: {
            productId: product.id,
            name,
            dailyRateCents: dailyRate,
            days,
            lineTotalCents: quote.rentalCents,
          },
        },
        contract: {
          create: {
            contractNumber: contractNumber(),
            status: "DRAFT",
          },
        },
      },
      select: {
        id: true,
        bookingNumber: true,
        contract: { select: { contractNumber: true } },
      },
    });

    await notifyBookingRequest({
      bookingNumber: created.bookingNumber,
      bookingId: created.id,
      contractNumber: created.contract?.contractNumber,
      name: d.name,
      email: d.email,
      phone: d.phone,
      address: [d.address, d.city].filter(Boolean).join(", ") || undefined,
      heroImageUrl: product.media[0]?.url,
      startAt: start,
      endAt: end,
      eventType: d.eventType || undefined,
      headcount: d.headcount != null ? String(d.headcount) : undefined,
      surfaceType: d.surfaceType || undefined,
      items: [
        {
          name,
          days,
          dailyRateCents: dailyRate,
          lineTotalCents: quote.rentalCents,
        },
      ],
      subtotalCents: quote.rentalCents,
      deliveryFeeCents: fees.deliveryBaseCents ?? 0,
      pickupFeeCents: fees.pickupCents ?? 0,
      depositCents: quote.depositCents,
      totalCents: quote.totalCents,
      locale: d.locale,
    });

    return {
      ok: true,
      bookingNumber: created.bookingNumber,
      contractNumber: created.contract?.contractNumber ?? "",
    };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
