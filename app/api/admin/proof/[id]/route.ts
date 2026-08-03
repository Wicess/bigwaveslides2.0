import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, can } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * Download a client's payment-proof screenshot as an attachment.
 *
 * The proof lives on R2 at an unguessable key, but we still gate this behind an
 * admin session (order.update) and stream it through our own origin so the
 * browser force-downloads it with a tidy filename — no CORS, no new-tab guess.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session || !can(session, "order.update")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true, proofImageUrl: true },
  });
  if (!order?.proofImageUrl) {
    return NextResponse.json({ error: "No proof on file" }, { status: 404 });
  }

  const upstream = await fetch(order.proofImageUrl).catch(() => null);
  if (!upstream || !upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Could not fetch the proof image" },
      { status: 502 },
    );
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  // Extension from the content type (fallback: from the URL, else .jpg).
  const extFromType = contentType.split("/")[1]?.split("+")[0];
  const extFromUrl = order.proofImageUrl.split(".").pop()?.split("?")[0];
  const ext = (extFromType || extFromUrl || "jpg").slice(0, 5);
  const filename = `payment-proof-${order.orderNumber}.${ext}`;

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
