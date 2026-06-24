import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminQuote } from "@/server/data/admin";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { QuoteControls } from "@/components/admin/quote-controls";

type Props = { params: Promise<{ id: string }> };

export default async function AdminQuoteDetail({ params }: Props) {
  await requirePermission("quote.read");
  const { id } = await params;
  const quote = await getAdminQuote(id);
  if (!quote) notFound();

  return (
    <div>
      <Link href="/admin/quotes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Quotes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold">{quote.quoteNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(quote.createdAt, "en")} · {quote.context}
          </p>
        </div>
        <StatusBadge status={quote.status} locale="en" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Request</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Name</dt><dd>{quote.guestName ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd>{quote.guestEmail ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{quote.guestPhone ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Event date</dt><dd>{quote.eventDate ? formatDate(quote.eventDate, "en") : "—"}</dd></div>
            </dl>
            {quote.message ? (
              <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm text-muted-foreground">
                {quote.message}
              </p>
            ) : null}
          </Card>

          {quote.items.length > 0 ? (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Items</h2>
              <ul className="divide-y divide-border text-sm">
                {quote.items.map((item) => (
                  <li key={item.id} className="py-2.5">
                    {item.label} × {item.quantity}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">Manage</h2>
          <QuoteControls
            id={quote.id}
            status={quote.status}
            estimateCents={quote.estimateCents}
            staffNotes={quote.staffNotes}
          />
        </Card>
      </div>
    </div>
  );
}
