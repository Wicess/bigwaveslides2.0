import { getAdminSession } from "@/lib/admin-auth";
import { decodeInvoice, type InvoiceModel } from "@/lib/invoice-image";
import { renderInvoiceImage } from "@/lib/invoice-render";

// Satori (the renderer behind ImageResponse) needs a real Node runtime here.
export const runtime = "nodejs";

/** Invoice PNG the owner sends to a client. Drawing lives in lib/invoice-render.tsx. */
export async function GET(req: Request) {
  // Admin-only. The payload is in the URL for statelessness, not secrecy.
  const session = await getAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const encoded = searchParams.get("d");
  if (!encoded) return new Response("Missing data", { status: 400 });

  const m: InvoiceModel | null = decodeInvoice(encoded);
  if (!m) return new Response("Bad data", { status: 400 });

  return renderInvoiceImage(m);
}
