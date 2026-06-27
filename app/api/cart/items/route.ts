import { NextResponse } from "next/server";
import { getCart } from "@/server/data/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Full cart contents for the slide-in cart drawer. */
export async function GET(req: Request) {
  const locale = new URL(req.url).searchParams.get("locale") ?? "en";
  const cart = await getCart(locale).catch(() => null);
  return NextResponse.json(cart ?? { id: null, lines: [], count: 0, subtotalCents: 0 }, {
    headers: { "Cache-Control": "no-store" },
  });
}
