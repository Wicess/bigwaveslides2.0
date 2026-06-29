"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileText, Download } from "lucide-react";
import { createAdminQuote } from "@/server/actions/admin-quotes";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

type Line = { label: string; quantity: string; unit: string };

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function downloadPdf(base64: string, name: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function QuoteBuilder() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [emailClient, setEmailClient] = useState(true);
  const [lines, setLines] = useState<Line[]>([{ label: "", quantity: "1", unit: "" }]);
  const [loading, setLoading] = useState(false);

  const total = lines.reduce(
    (n, l) => n + (Number(l.quantity) || 0) * Math.round((Number(l.unit) || 0) * 100),
    0,
  );

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { label: "", quantity: "1", unit: "" }]);
  const removeLine = (i: number) => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const items = lines
      .filter((l) => l.label.trim() && Number(l.quantity) > 0)
      .map((l) => ({
        label: l.label.trim(),
        quantity: Number(l.quantity),
        unitCents: Math.round((Number(l.unit) || 0) * 100),
      }));
    if (!name.trim() || !email.trim()) return toast.error("Name and email are required.");
    if (items.length === 0) return toast.error("Add at least one line item.");

    setLoading(true);
    const res = await createAdminQuote({ name, email, phone, eventDate, message, emailClient, items });
    setLoading(false);

    if (res.ok) {
      downloadPdf(res.pdfBase64, `Quote-${res.quoteNumber}.pdf`);
      toast.success(
        res.emailed
          ? `Quote ${res.quoteNumber} created, emailed to ${email}, and downloaded.`
          : `Quote ${res.quoteNumber} created and downloaded.`,
      );
      router.push("/admin/quotes");
      router.refresh();
    } else {
      toast.error(res.error ?? "Couldn't create the quote.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Customer */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Customer name *</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email *</span>
          <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Phone</span>
          <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Event date</span>
          <input type="date" className={input} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </label>
      </div>

      {/* Line items */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Line items</span>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="size-4" /> Add item
          </Button>
        </div>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-end gap-2">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-muted-foreground">Description</span>
                <input
                  className={input}
                  placeholder="e.g. Tropical Wave 18 — 1-day rental"
                  value={l.label}
                  onChange={(e) => setLine(i, { label: e.target.value })}
                />
              </label>
              <label className="w-16">
                <span className="mb-1 block text-xs text-muted-foreground">Qty</span>
                <input
                  type="number"
                  min={1}
                  className={input}
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                />
              </label>
              <label className="w-28">
                <span className="mb-1 block text-xs text-muted-foreground">Unit ($)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={input}
                  placeholder="0.00"
                  value={l.unit}
                  onChange={(e) => setLine(i, { unit: e.target.value })}
                />
              </label>
              <button
                type="button"
                onClick={() => removeLine(i)}
                aria-label="Remove item"
                className="mb-1 grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-3 border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Estimate total</span>
          <span className="text-lg font-bold">{fmt(total)}</span>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Message / notes (optional)</span>
        <textarea
          className={`${input} min-h-20`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything to include with the quote…"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={emailClient}
          onChange={(e) => setEmailClient(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Email the PDF quote to the client automatically
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="gradient" disabled={loading}>
          {loading ? (
            <>Generating…</>
          ) : emailClient ? (
            <><FileText className="size-4" /> Create, email & download PDF</>
          ) : (
            <><Download className="size-4" /> Create & download PDF</>
          )}
        </Button>
      </div>
    </form>
  );
}
