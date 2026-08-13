import { notFound } from "next/navigation";
import { FileText, Package, Settings } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminQuote } from "@/server/data/admin";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { QuoteControls } from "@/components/admin/quote-controls";
import {
  AdminCard,
  BackLink,
  Reveal,
  SectionTitle,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminQuoteDetail({ params }: Props) {
  await requirePermission("quote.read");
  const { id } = await params;
  const quote = await getAdminQuote(id);
  if (!quote) notFound();

  return (
    <div>
      <BackLink href="/admin/quotes">Quotes</BackLink>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-foreground font-mono text-2xl font-bold">
              {quote.quoteNumber}
            </h1>
            <p className="text-muted-foreground text-sm">
              {formatDate(quote.createdAt, "en")} · {quote.context}
            </p>
          </div>
          <StatusBadge status={quote.status} />
        </div>
      </Reveal>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Reveal delay={0.05}>
            <AdminCard className="p-6">
              <SectionTitle icon={FileText}>Request</SectionTitle>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label="Name" value={quote.guestName ?? "—"} />
                <Field label="Email" value={quote.guestEmail ?? "—"} />
                <Field label="Phone" value={quote.guestPhone ?? "—"} />
                <Field
                  label="Event date"
                  value={
                    quote.eventDate ? formatDate(quote.eventDate, "en") : "—"
                  }
                />
              </div>
              {quote.message ? (
                <p className="bg-muted/50 text-foreground/80 mt-4 rounded-2xl p-3.5 text-sm whitespace-pre-line">
                  {quote.message}
                </p>
              ) : null}
            </AdminCard>
          </Reveal>

          {quote.items.length > 0 ? (
            <Reveal delay={0.1}>
              <AdminCard className="p-6">
                <SectionTitle icon={Package}>Items</SectionTitle>
                <ul className="divide-border/70 divide-y text-sm">
                  {quote.items.map((item) => (
                    <li key={item.id} className="text-foreground/80 py-2.5">
                      {item.label}{" "}
                      <span className="text-muted-foreground">
                        × {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </AdminCard>
            </Reveal>
          ) : null}
        </div>

        <Reveal delay={0.12}>
          <AdminCard className="h-fit p-6 lg:sticky lg:top-2">
            <SectionTitle icon={Settings}>Manage</SectionTitle>
            <QuoteControls
              id={quote.id}
              status={quote.status}
              estimateCents={quote.estimateCents}
              staffNotes={quote.staffNotes}
            />
          </AdminCard>
        </Reveal>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {label}
      </p>
      <p className="text-foreground/80 mt-0.5">{value}</p>
    </div>
  );
}
