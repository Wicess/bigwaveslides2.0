import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Polled by the invoice page while the owner is posting payment details, so
// the reveal feels instant. Returns only coarse state — authorized by the
// unguessable order number plus a matching email, so it can never leak
// another client's details.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  const order = await prisma.order
    .findUnique({
      where: { orderNumber: number },
      select: {
        guestEmail: true,
        stage: true,
        paymentDetailsState: true,
        paymentDestination: true,
      },
    })
    .catch(() => null);

  if (!order || !email || order.guestEmail?.toLowerCase() !== email) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    stage: order.stage,
    state: order.paymentDetailsState,
    hasDetails: Boolean(order.paymentDestination),
    paid: order.paymentDetailsState === "PAID",
  });
}
