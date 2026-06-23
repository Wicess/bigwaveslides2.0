import "server-only";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { eachDate, toISODate } from "@/lib/rental-pricing";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Availability is hard-blocked ONLY by CONFIRMED bookings — tentative
 * (REQUESTED) holds never block the calendar, per the request-based model.
 * A product is available for a date when active units > confirmed bookings.
 */

async function activeUnitCount(productId: string): Promise<number> {
  return withRetry(() =>
    prisma.rentalUnit.count({ where: { productId, isActive: true } }),
  ).catch(() => 0);
}

/** Map of `YYYY-MM-DD` → number of units consumed by confirmed bookings. */
async function bookedByDate(
  productId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<Map<string, number>> {
  const bookings = await withRetry(() =>
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        eventStartDate: { lte: windowEnd },
        eventEndDate: { gte: windowStart },
        items: { some: { productId } },
      },
      select: {
        eventStartDate: true,
        eventEndDate: true,
        items: { where: { productId }, select: { id: true } },
      },
    }),
  ).catch(() => []);

  const map = new Map<string, number>();
  for (const b of bookings) {
    const units = Math.max(1, b.items.length);
    for (const day of eachDate(
      toISODate(b.eventStartDate),
      toISODate(b.eventEndDate),
    )) {
      map.set(day, (map.get(day) ?? 0) + units);
    }
  }
  return map;
}

export type AvailabilityWindow = {
  totalUnits: number;
  /** Dates (YYYY-MM-DD) that are fully booked within the window. */
  blockedDates: string[];
};

/** Blocked dates for a forward window (default 180 days) — powers the calendar. */
export async function getAvailabilityWindow(
  productId: string,
  fromISO?: string,
  days = 180,
): Promise<AvailabilityWindow> {
  const start = fromISO ? new Date(`${fromISO}T00:00:00.000Z`) : new Date();
  const windowStart = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const windowEnd = new Date(windowStart.getTime() + days * MS_PER_DAY);

  const [totalUnits, booked] = await Promise.all([
    activeUnitCount(productId),
    bookedByDate(productId, windowStart, windowEnd),
  ]);

  const blockedDates: string[] = [];
  if (totalUnits > 0) {
    for (const [day, count] of booked) {
      if (count >= totalUnits) blockedDates.push(day);
    }
  }
  return { totalUnits, blockedDates: blockedDates.sort() };
}

export type RangeAvailability = {
  available: boolean;
  totalUnits: number;
  /** Fewest free units across the requested range. */
  minAvailable: number;
  conflictDates: string[];
};

/** Check whether a product can be booked across an inclusive date range. */
export async function checkRange(
  productId: string,
  startISO: string,
  endISO: string,
): Promise<RangeAvailability> {
  const dates = eachDate(startISO, endISO);
  if (dates.length === 0) {
    return { available: false, totalUnits: 0, minAvailable: 0, conflictDates: [] };
  }

  const totalUnits = await activeUnitCount(productId);
  if (totalUnits === 0) {
    return { available: false, totalUnits: 0, minAvailable: 0, conflictDates: dates };
  }

  const booked = await bookedByDate(
    productId,
    new Date(`${dates[0]}T00:00:00.000Z`),
    new Date(`${dates[dates.length - 1]}T00:00:00.000Z`),
  );

  let minAvailable = totalUnits;
  const conflictDates: string[] = [];
  for (const day of dates) {
    const free = totalUnits - (booked.get(day) ?? 0);
    minAvailable = Math.min(minAvailable, free);
    if (free <= 0) conflictDates.push(day);
  }

  return {
    available: conflictDates.length === 0,
    totalUnits,
    minAvailable: Math.max(0, minAvailable),
    conflictDates,
  };
}
