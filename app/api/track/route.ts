import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import type { AnalyticsEventType } from "@prisma/client";
import { recordEvent } from "@/lib/analytics/track";
import {
  geoFromHeaders,
  geoFromIp,
  ipFromHeaders,
  needsGeoEnrichment,
  parseUserAgent,
} from "@/lib/analytics/geo";
import {
  visitorFingerprint,
  sessionFingerprint,
} from "@/lib/analytics/fingerprint";
import { APP_INSTALLED_COOKIE } from "@/lib/loyalty";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "bws_vid";
const SESSION_COOKIE = "bws_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;
const SESSION_WINDOW = 60 * 30; // 30 min sliding session

// PAGE_LEAVE is intentionally NOT accepted: it doubled the Postgres writes per
// navigation for low-value time-on-page data and helped pin the serverless DB
// awake. Any stale beacons from cached JS are dropped here.
const ALLOWED: ReadonlySet<AnalyticsEventType> = new Set([
  "PAGE_VIEW",
  "SESSION_START",
  "ADD_TO_CART",
  "REMOVE_FROM_CART",
  "CART_VIEW",
  "CHECKOUT_START",
  "ORDER_REQUEST",
  "BOOKING_REQUEST",
  "QUOTE_REQUEST",
  "CONTACT",
  "NEWSLETTER_SUBSCRIBE",
  "APP_INSTALL",
  "APP_UNINSTALL",
]);

export async function POST(req: NextRequest) {
  // Always answer 204 quickly — beacons don't read the body, and we never want
  // a tracking error to surface to the visitor.
  const res = new NextResponse(null, { status: 204 });

  try {
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const type = body.type as AnalyticsEventType;
    if (!ALLOWED.has(type)) return res;

    const secure = process.env.NODE_ENV === "production";
    const jar = await cookies();
    const cookieVisitor = jar.get(VISITOR_COOKIE)?.value;
    const cookieSession = jar.get(SESSION_COOKIE)?.value;

    let geo = geoFromHeaders(req.headers);
    // Expand region/state names worldwide via IP when edge headers only give a
    // code (US/CA are already expanded). Cached per-IP; best-effort.
    //
    // Also run it for a first-time visitor even when geo is already complete:
    // the lookup carries the datacenter flag, and `device` is only written when
    // the Visitor row is created, so this is the one chance to classify them.
    const firstTimeVisitor = !cookieVisitor;
    if (needsGeoEnrichment(geo) || firstTimeVisitor) {
      const enriched = await geoFromIp(ipFromHeaders(req.headers));
      if (enriched) {
        geo = {
          country: enriched.country ?? geo.country,
          countryCode: enriched.countryCode ?? geo.countryCode,
          region: enriched.region ?? geo.region,
          regionCode: enriched.regionCode ?? geo.regionCode,
          city: enriched.city ?? geo.city,
          datacenter: enriched.datacenter,
        };
      }
    }
    const userAgent = req.headers.get("user-agent");
    const parsedUa = parseUserAgent(userAgent);
    // A crawler on a stock Chrome UA still runs from a cloud range — trust the
    // IP over the string it chose to send.
    const ua = geo.datacenter
      ? { ...parsedUa, device: "BOT" as const }
      : parsedUa;

    // App installs: stamp the client's IP into the event (for the admin
    // location monitor) and set the readable cookie that unlocks the +5% app
    // discount at checkout, on this browser, for a year.
    const clientMeta =
      body.meta && typeof body.meta === "object"
        ? (body.meta as Record<string, unknown>)
        : null;
    let meta = clientMeta;
    if (type === "APP_INSTALL") {
      meta = { ...(clientMeta ?? {}), ip: ipFromHeaders(req.headers) };
      // Readable (not httpOnly) so the client can tell it's already recorded and
      // skip duplicate posts; the server still reads it at checkout. It's only a
      // loyalty flag — no security value.
      res.cookies.set(APP_INSTALLED_COOKIE, "1", {
        maxAge: ONE_YEAR,
        httpOnly: false,
        sameSite: "lax",
        secure,
        path: "/",
      });
    }
    if (type === "APP_UNINSTALL") {
      // The cookie IS the discount — checkout reads nothing else to decide the
      // +5% app bonus (server/actions/orders.ts, reservations.ts). Deleting it
      // here is what actually revokes the perk; the event row is the audit
      // trail. Same attributes as the set above so the browser matches and
      // removes the right cookie rather than shadowing it.
      res.cookies.set(APP_INSTALLED_COOKIE, "", {
        maxAge: 0,
        httpOnly: false,
        sameSite: "lax",
        secure,
        path: "/",
      });
    }

    // Identity: the visitor cookie is authoritative for real browsers. When it's
    // absent (bots, crawlers, privacy/cookie-cleared clients) fall back to a
    // stable fingerprint of user-agent + geo so identical/returning clients
    // collapse onto one Visitor instead of a fresh random id per request.
    const visitorKey = cookieVisitor ?? visitorFingerprint(userAgent, geo);
    const sessionKey =
      cookieSession ??
      (cookieVisitor
        ? randomUUID()
        : sessionFingerprint(visitorKey, new Date()));

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

    await recordEvent({
      visitorKey,
      sessionKey,
      type,
      path: typeof body.path === "string" ? body.path : null,
      title: typeof body.title === "string" ? body.title : null,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      durationMs: typeof body.durationMs === "number" ? body.durationMs : null,
      meta,
      geo,
      ua,
      userAgent,
    });
  } catch {
    // ignore — analytics is best-effort
  }

  return res;
}
