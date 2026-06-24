import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import type { AnalyticsEventType } from "@prisma/client";
import { recordEvent } from "@/lib/analytics/track";
import { geoFromHeaders, parseUserAgent } from "@/lib/analytics/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "bws_vid";
const SESSION_COOKIE = "bws_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;
const SESSION_WINDOW = 60 * 30; // 30 min sliding session

const ALLOWED: ReadonlySet<AnalyticsEventType> = new Set([
  "PAGE_VIEW",
  "PAGE_LEAVE",
  "SESSION_START",
  "ADD_TO_CART",
  "REMOVE_FROM_CART",
  "CART_VIEW",
  "CHECKOUT_START",
  "ORDER_REQUEST",
  "BOOKING_REQUEST",
  "QUOTE_REQUEST",
  "CONTACT",
]);

export async function POST(req: NextRequest) {
  // Always answer 204 quickly — beacons don't read the body, and we never want
  // a tracking error to surface to the visitor.
  const res = new NextResponse(null, { status: 204 });

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const type = body.type as AnalyticsEventType;
    if (!ALLOWED.has(type)) return res;

    const secure = process.env.NODE_ENV === "production";
    const jar = await cookies();
    let visitorKey = jar.get(VISITOR_COOKIE)?.value;
    let sessionKey = jar.get(SESSION_COOKIE)?.value;

    if (!visitorKey) visitorKey = randomUUID();
    if (!sessionKey) sessionKey = randomUUID();

    res.cookies.set(VISITOR_COOKIE, visitorKey, {
      maxAge: ONE_YEAR,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });
    res.cookies.set(SESSION_COOKIE, sessionKey, {
      maxAge: SESSION_WINDOW,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });

    const geo = geoFromHeaders(req.headers);
    const userAgent = req.headers.get("user-agent");
    const ua = parseUserAgent(userAgent);

    await recordEvent({
      visitorKey,
      sessionKey,
      type,
      path: typeof body.path === "string" ? body.path : null,
      title: typeof body.title === "string" ? body.title : null,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      durationMs: typeof body.durationMs === "number" ? body.durationMs : null,
      meta:
        body.meta && typeof body.meta === "object"
          ? (body.meta as Record<string, unknown>)
          : null,
      geo,
      ua,
      userAgent,
    });
  } catch {
    // ignore — analytics is best-effort
  }

  return res;
}
