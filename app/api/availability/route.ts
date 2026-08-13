import { NextResponse } from "next/server";
import { getAvailabilityWindow, checkRange } from "@/server/data/availability";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Real-time rental availability.
 *   GET ?productId=&start=&end=  → range check (instant quote)
 *   GET ?productId=&from=&days=  → blocked dates for the calendar window
 */
export async function GET(request: Request) {
  const limit = rateLimit(clientKey(request, "availability"), 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (start && end) {
    const result = await checkRange(productId, start, end);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const from = searchParams.get("from") ?? undefined;
  const days = Number(searchParams.get("days")) || 180;
  const window = await getAvailabilityWindow(
    productId,
    from,
    Math.min(365, days),
  );
  return NextResponse.json(window, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
