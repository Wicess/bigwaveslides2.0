import { NextResponse } from "next/server";
import { getCartCount } from "@/server/data/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Item count for the header cart badge. */
export async function GET() {
  const count = await getCartCount().catch(() => 0);
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
