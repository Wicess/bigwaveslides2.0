import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta webhook verification handshake. */
export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * Delivery/status receipts + inbound messages. We acknowledge with 200 so Meta
 * doesn't retry; message handling/automation can be layered on later.
 */
export async function POST(req: NextRequest) {
  try {
    await req.json().catch(() => null);
    // TODO: persist delivery receipts / route inbound messages if needed.
  } catch {
    /* ignore malformed payloads */
  }
  return NextResponse.json({ received: true });
}
