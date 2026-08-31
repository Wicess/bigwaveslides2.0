import "server-only";
import type { AnalyticsEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { GeoInfo, UaInfo } from "@/lib/analytics/geo";

export type TrackInput = {
  visitorKey: string;
  sessionKey: string;
  type: AnalyticsEventType;
  path?: string | null;
  title?: string | null;
  referrer?: string | null;
  durationMs?: number | null;
  meta?: Record<string, unknown> | null;
  geo: GeoInfo;
  ua: UaInfo;
  userAgent?: string | null;
};

/** Trim a value so a hostile client can't bloat the row. */
function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Record a single analytics event, lazily creating the Visitor (by cookie key)
 * and Visit (session). Resilient: callers should never have a tracking failure
 * affect the user, so this swallows its own errors.
 *
 * COST: batched into 2 database round trips for a returning visitor (3 when a
 * new session opens), down from 5 and 7 sequential awaits. Neon bills by how
 * long the compute stays awake and only suspends after ~5 minutes with zero
 * queries, so on a path that runs for every pageview the number of round trips
 * is what keeps the database up, not the size of any one statement.
 *
 * No data is lost or sampled to achieve that — same rows, same geo, same
 * rollups, fewer trips. Geolocation in particular (country/region/city from the
 * x-vercel-ip-* edge headers) is written exactly as before.
 */
export async function recordEvent(input: TrackInput): Promise<void> {
  const { geo, ua } = input;
  const now = new Date();
  const path = clip(input.path, 512);
  const title = clip(input.title, 300);
  const referrer = clip(input.referrer, 512);
  const isPageView = input.type === "PAGE_VIEW";
  const isLeave = input.type === "PAGE_LEAVE";

  try {
    const geoPatch = {
      ...(geo.country ? { country: geo.country } : {}),
      ...(geo.countryCode ? { countryCode: geo.countryCode } : {}),
      ...(geo.region ? { region: geo.region } : {}),
      ...(geo.regionCode ? { regionCode: geo.regionCode } : {}),
      ...(geo.city ? { city: geo.city } : {}),
    };

    // ── Round trip 1: visitor + session lookup, batched ──────────────────
    // These are independent — the session is keyed by its own cookie — so they
    // go in one batch instead of two sequential awaits. Every round trip is
    // time the Neon compute has to be awake, and this path runs on EVERY
    // pageview, so the count matters more than the size of any one query.
    //
    // NOTHING is dropped here. The same geo (country/region/city from the
    // x-vercel-ip-* headers), the same device and referrer, the same rollups —
    // this only changes how many times we go to the database to write them.
    const [visitor, existingVisit] = await prisma.$transaction([
      prisma.visitor.upsert({
        where: { visitorKey: input.visitorKey },
        create: {
          visitorKey: input.visitorKey,
          firstSeenAt: now,
          lastSeenAt: now,
          device: ua.device,
          browser: ua.browser,
          os: ua.os,
          userAgent: clip(input.userAgent, 512),
          firstReferrer: referrer,
          landingPath: path,
          ...geoPatch,
        },
        update: { lastSeenAt: now, ...geoPatch },
        select: { id: true },
      }),
      prisma.visit.findUnique({
        where: { sessionKey: input.sessionKey },
        select: { id: true, startedAt: true, exitPath: true },
      }),
    ]);

    // ── Round trip 2 (new sessions only): open the visit ─────────────────
    let visit = existingVisit;
    if (!visit) {
      const [created] = await prisma.$transaction([
        prisma.visit.create({
          data: {
            sessionKey: input.sessionKey,
            visitorId: visitor.id,
            startedAt: now,
            lastSeenAt: now,
            landingPath: path,
            referrer,
          },
          select: { id: true, startedAt: true, exitPath: true },
        }),
        prisma.visitor.update({
          where: { id: visitor.id },
          data: { visitCount: { increment: 1 } },
        }),
      ]);
      visit = created;
    }

    // ── Round trip 3: the event and both rollups, batched ────────────────
    await prisma.$transaction([
      prisma.analyticsEvent.create({
        data: {
          type: input.type,
          visitorId: visitor.id,
          visitId: visit.id,
          path,
          title,
          referrer,
          durationMs:
            typeof input.durationMs === "number" && input.durationMs >= 0
              ? Math.min(input.durationMs, 1000 * 60 * 60 * 6)
              : null,
          meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      }),
      prisma.visit.update({
        where: { id: visit.id },
        data: {
          lastSeenAt: now,
          durationMs: Math.max(0, now.getTime() - visit.startedAt.getTime()),
          ...(path ? { exitPath: path } : {}),
          ...(isPageView ? { pageViews: { increment: 1 } } : {}),
          ...(isLeave ? { endedAt: now } : {}),
        },
      }),
      prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          eventCount: { increment: 1 },
          ...(isPageView ? { pageViewCount: { increment: 1 } } : {}),
        },
      }),
    ]);
  } catch {
    // Analytics must never break a page — fail silently.
  }
}
