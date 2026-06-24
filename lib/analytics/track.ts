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

    const visitor = await prisma.visitor.upsert({
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
    });

    // Resolve (or open) the session for this cookie.
    let visit = await prisma.visit.findUnique({
      where: { sessionKey: input.sessionKey },
      select: { id: true, startedAt: true, exitPath: true },
    });
    if (!visit) {
      visit = await prisma.visit.create({
        data: {
          sessionKey: input.sessionKey,
          visitorId: visitor.id,
          startedAt: now,
          lastSeenAt: now,
          landingPath: path,
          referrer,
        },
        select: { id: true, startedAt: true, exitPath: true },
      });
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: { visitCount: { increment: 1 } },
      });
    }

    await prisma.analyticsEvent.create({
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
    });

    await prisma.visit.update({
      where: { id: visit.id },
      data: {
        lastSeenAt: now,
        durationMs: Math.max(0, now.getTime() - visit.startedAt.getTime()),
        ...(path ? { exitPath: path } : {}),
        ...(isPageView ? { pageViews: { increment: 1 } } : {}),
        ...(isLeave ? { endedAt: now } : {}),
      },
    });

    await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        eventCount: { increment: 1 },
        ...(isPageView ? { pageViewCount: { increment: 1 } } : {}),
      },
    });
  } catch {
    // Analytics must never break a page — fail silently.
  }
}
