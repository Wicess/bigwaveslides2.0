import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Flush the data cache for one or more tags.
 *
 * WHY THIS EXISTS
 * Product, blog and testimonial reads go through `unstable_cache` with tags,
 * and the admin actions that write those tables call `revalidateTag` on the way
 * out. Maintenance scripts cannot: they run as plain Node against Postgres,
 * outside any Next.js request, so `revalidateTag` is not available to them.
 *
 * That gap is not theoretical. Renaming all 53 products directly in the database
 * left the live site serving the old names and old URLs afterwards — and it was
 * genuinely confusing to diagnose, because Vercel's Data Cache SURVIVES a
 * redeploy, so the usual "just deploy again" reflex does not clear it and
 * `x-vercel-cache: MISS` on the route says nothing about it.
 *
 * Auth: an admin session, or a bearer token matching CRON_SECRET so a script or
 * a deploy hook can call it without a browser.
 *
 *   curl -X POST https://<site>/api/admin/revalidate \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"tags":["products"]}'
 */
const KNOWN_TAGS = [
  "products",
  "categories",
  "services",
  "testimonials",
  "reviews",
  "blog",
  "settings",
] as const;

export async function POST(req: Request) {
  const bearer = req.headers.get("authorization");
  const viaSecret =
    Boolean(env.CRON_SECRET) && bearer === `Bearer ${env.CRON_SECRET}`;
  const viaAdmin = viaSecret ? false : Boolean(await getAdminSession());
  if (!viaSecret && !viaAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { tags?: unknown };
  const requested = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : [];

  // Default to everything: a script that just rewrote the catalog rarely knows
  // which of the overlapping tag sets it touched, and over-flushing costs one
  // slow render rather than another hour of stale pages.
  const tags = requested.length ? requested : [...KNOWN_TAGS];
  const unknown = tags.filter(
    (t) => !(KNOWN_TAGS as readonly string[]).includes(t),
  );
  if (unknown.length) {
    return NextResponse.json(
      { error: `Unknown tag(s): ${unknown.join(", ")}`, known: KNOWN_TAGS },
      { status: 400 },
    );
  }

  for (const t of tags) revalidateTag(t);
  return NextResponse.json({ ok: true, revalidated: tags });
}
