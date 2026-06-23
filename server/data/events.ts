import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  status: true,
  startAt: true,
  endAt: true,
  location: true,
  capacity: true,
  registrationEnabled: true,
  _count: { select: { registrations: true } },
} satisfies Prisma.EventSelect;

/** Upcoming/ongoing events (soonest first) and past events (most recent first). */
export async function getEvents() {
  const now = new Date();
  const [upcoming, past] = await withRetry(() =>
    Promise.all([
      prisma.event.findMany({
        where: { status: { in: ["UPCOMING", "ONGOING"] } },
        select: cardSelect,
        orderBy: { startAt: "asc" },
      }),
      prisma.event.findMany({
        where: {
          OR: [{ status: "PAST" }, { endAt: { lt: now } }, { startAt: { lt: now } }],
          status: { not: "CANCELLED" },
        },
        select: cardSelect,
        orderBy: { startAt: "desc" },
        take: 6,
      }),
    ]),
  ).catch(() => [[], []] as const);

  // Avoid showing an event in both lists.
  const upcomingIds = new Set(upcoming.map((e) => e.id));
  return { upcoming, past: past.filter((e) => !upcomingIds.has(e.id)) };
}

export type EventCard = Awaited<ReturnType<typeof getEvents>>["upcoming"][number];

export async function getEventBySlug(slug: string) {
  return withRetry(() =>
    prisma.event.findFirst({
      where: { slug, status: { not: "CANCELLED" } },
      include: { _count: { select: { registrations: true } } },
    }),
  ).catch(() => null);
}

export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>;

export async function getEventSlugs() {
  return withRetry(() =>
    prisma.event.findMany({ select: { slug: true } }),
  ).catch(() => []);
}

/** Remaining capacity, or null when the event has no cap. */
export function spotsLeft(
  capacity: number | null,
  registrationCount: number,
): number | null {
  if (capacity == null) return null;
  return Math.max(0, capacity - registrationCount);
}
