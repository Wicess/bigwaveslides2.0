"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";
import { quoteNumber } from "@/lib/ref-number";
import { generateQuotePdf, type QuotePdfInput } from "@/lib/pdf/quote-pdf";
import { sendEmail, renderEmail, siteUrl } from "@/lib/email";
import { formatPrice } from "@/lib/format";

const QUOTE_STATUS = ["NEW", "REVIEWED", "QUOTED", "WON", "LOST"] as const;

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(QUOTE_STATUS),
  estimate: z.string().optional(), // dollars, optional
  staffNotes: z.string().max(2000).optional().or(z.literal("")),
});

export type AdminActionResult = { ok: boolean; error?: string };

type UpdateQuoteInput = {
  id: string;
  status: string;
  estimate?: string;
  staffNotes?: string;
};

export async function updateQuote(
  input: UpdateQuoteInput,
): Promise<AdminActionResult> {
  const session = await requirePermission("quote.update");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  const { id, status, estimate, staffNotes } = parsed.data;

  const estimateCents =
    estimate && estimate.trim() !== ""
      ? Math.round(Number(estimate) * 100)
      : null;
  if (estimate && Number.isNaN(estimateCents)) {
    return { ok: false, error: "Estimate must be a number." };
  }

  try {
    await prisma.quoteRequest.update({
      where: { id },
      data: {
        status,
        estimateCents: estimateCents ?? undefined,
        staffNotes: staffNotes || null,
      },
    });
    await logActivity(session.id, "quote.update", {
      entityType: "QuoteRequest",
      entityId: id,
      summary: `Quote set to ${status}`,
    });
    revalidatePath(`/admin/quotes/${id}`);
    revalidatePath("/admin/quotes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the quote." };
  }
}

/* ───────────────── Create a quote (admin-generated) ───────────────── */

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  emailClient: z.boolean().default(true),
  items: z
    .array(
      z.object({
        label: z.string().min(1).max(160),
        quantity: z.coerce.number().int().min(1).max(999),
        unitCents: z.coerce.number().int().min(0).max(100_000_000),
      }),
    )
    .min(1),
});

export type CreateQuoteResult =
  | { ok: true; quoteNumber: string; pdfBase64: string; emailed: boolean }
  | { ok: false; error: string };

/**
 * Create a quote from the admin dashboard for a client who asked for one. Saves
 * it (status QUOTED) with line items, generates a branded PDF, optionally emails
 * it to the client, and returns the PDF (base64) for instant download.
 */
export async function createAdminQuote(
  input: z.input<typeof createSchema>,
): Promise<CreateQuoteResult> {
  const session = await requirePermission("quote.update");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  const d = parsed.data;
  const subtotalCents = d.items.reduce(
    (n, i) => n + i.quantity * i.unitCents,
    0,
  );
  const number = quoteNumber();

  try {
    const quote = await prisma.quoteRequest.create({
      data: {
        quoteNumber: number,
        guestName: d.name,
        guestEmail: d.email,
        guestPhone: d.phone || null,
        status: "QUOTED",
        context: "GENERAL",
        eventDate: d.eventDate ? new Date(d.eventDate) : null,
        message: d.message || null,
        estimateCents: subtotalCents,
        items: {
          create: d.items.map((i) => ({
            label: i.label,
            quantity: i.quantity,
            notes: `${formatPrice(i.unitCents, "en")} each`,
          })),
        },
      },
      select: { id: true },
    });

    const now = new Date();
    const pdfInput: QuotePdfInput = {
      kind: "order",
      number,
      dateLabel: now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      eventDateLabel: d.eventDate
        ? new Date(`${d.eventDate}T12:00:00`).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : undefined,
      party: "Renter",
      customer: { name: d.name, email: d.email, phone: d.phone || undefined },
      items: d.items.map((i) => ({
        name: i.label,
        qtyLabel: `×${i.quantity}`,
        rateLabel: formatPrice(i.unitCents, "en"),
        amountCents: i.quantity * i.unitCents,
      })),
      totals: { subtotalCents, totalCents: subtotalCents },
      locale: "en",
    };
    const pdf = await generateQuotePdf(pdfInput);

    let emailed = false;
    if (d.emailClient) {
      const res = await sendEmail({
        to: d.email,
        subject: `Your invoice ${number} — Big Wave Slides`,
        html: renderEmail({
          heading: "Your invoice is ready",
          intro: `Hi ${d.name}, thanks for reaching out! Your invoice ${number} is attached as a PDF — this is the only invoice you'll receive. Sign it, tick your preferred payment method, and reply to this email to confirm.`,
          rows: [
            { label: "Invoice no", value: number },
            { label: "Total due", value: formatPrice(subtotalCents, "en") },
          ],
          cta: { label: "Talk to us", url: siteUrl("/contact") },
          outro:
            "Reply to this email with any questions — we're happy to help.",
        }),
        attachments: [
          { filename: `Big-Wave-Slides-Invoice-${number}.pdf`, content: pdf },
        ],
      }).catch(() => ({ ok: false }));
      emailed = !!res.ok;
    }

    await logActivity(session.id, "quote.create", {
      entityType: "QuoteRequest",
      entityId: quote.id,
      summary: `Created quote ${number} for ${d.name}`,
    });
    revalidatePath("/admin/quotes");
    return {
      ok: true,
      quoteNumber: number,
      pdfBase64: pdf.toString("base64"),
      emailed,
    };
  } catch {
    return { ok: false, error: "Couldn't create the quote." };
  }
}
