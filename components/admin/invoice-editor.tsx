"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, Trash2 } from "lucide-react";
import {
  editOrderInvoice,
  resendOrderInvoice,
} from "@/server/actions/admin-invoice";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Line = {
  key: string;
  id?: string;
  name: string;
  quantity: string;
  price: string;
};

const toDollars = (c: number) => (c / 100).toFixed(2);
/** "12", "12.5", "$1,250.05" → cents; null when it is not an amount. */
function toCents(raw: string): number | null {
  const clean = raw.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, frac = ""] = clean.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}
const money = (c: number) =>
  `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Edit the order's invoice and post it to the customer's chat. Lines can be
 * changed, added or removed; transport and discount are amounts; the note prints
 * on the invoice. The new total is worked out as you type.
 */
export function InvoiceEditor({
  orderId,
  items,
  deliveryFeeCents,
  discountCents,
  invoiceNote,
  locked,
}: {
  orderId: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
  }[];
  deliveryFeeCents: number;
  discountCents: number;
  invoiceNote: string | null;
  locked: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [lines, setLines] = useState<Line[]>(() =>
    items.map((i) => ({
      key: i.id,
      id: i.id,
      name: i.name,
      quantity: String(i.quantity),
      price: toDollars(i.unitPriceCents),
    })),
  );
  const [transport, setTransport] = useState(toDollars(deliveryFeeCents));
  const [discount, setDiscount] = useState(toDollars(discountCents));
  const [note, setNote] = useState(invoiceNote ?? "");
  const [reason, setReason] = useState("");
  const [sendToChat, setSendToChat] = useState(true);

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const l of lines) {
      const q = Number(l.quantity);
      const p = toCents(l.price);
      if (!Number.isInteger(q) || q < 1 || p === null || !l.name.trim())
        return null;
      subtotal += q * p;
    }
    const t = toCents(transport || "0");
    const dsc = toCents(discount || "0");
    if (t === null || dsc === null) return null;
    return { subtotal, total: subtotal + t - dsc };
  }, [lines, transport, discount]);

  const update = (key: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  function save() {
    if (!totals || totals.total < 0) return;
    start(async () => {
      const res = await editOrderInvoice({
        orderId,
        items: lines.map((l) => ({
          ...(l.id ? { id: l.id } : {}),
          name: l.name.trim(),
          quantity: Number(l.quantity),
          unitPriceCents: toCents(l.price)!,
        })),
        deliveryFeeCents: toCents(transport || "0")!,
        discountCents: toCents(discount || "0")!,
        invoiceNote: note,
        reason,
        sendToChat,
      });
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        setReason("");
        router.refresh();
      } else toast.error(res.error ?? "Couldn't save the invoice.");
    });
  }

  function resend() {
    start(async () => {
      const res = await resendOrderInvoice(orderId);
      if (res.ok) toast.success(res.message ?? "Sent.");
      else toast.error(res.error ?? "Couldn't send it.");
    });
  }

  if (locked) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          This order has been paid, or payment proof is in, so the invoice is
          now a record and can&apos;t be changed.
        </p>
        <Button
          onClick={resend}
          variant="outline"
          loading={pending}
          className="w-full"
        >
          <Send className="size-4" /> Send invoice to the customer&apos;s chat
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2.5">
        {lines.map((l) => (
          <li
            key={l.key}
            className="border-border space-y-2 rounded-xl border p-3"
          >
            <div className="flex items-center gap-2">
              <Input
                aria-label="Description"
                value={l.name}
                onChange={(e) => update(l.key, { name: e.target.value })}
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                aria-label="Remove line"
                disabled={lines.length === 1}
                onClick={() =>
                  setLines((ls) => ls.filter((x) => x.key !== l.key))
                }
                className="text-muted-foreground grid size-10 shrink-0 place-items-center rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-muted-foreground text-xs">
                Qty / days
                <Input
                  inputMode="numeric"
                  value={l.quantity}
                  onChange={(e) => update(l.key, { quantity: e.target.value })}
                  className="mt-1"
                />
              </label>
              <label className="text-muted-foreground text-xs">
                Unit price ($)
                <Input
                  inputMode="decimal"
                  value={l.price}
                  onChange={(e) => update(l.key, { price: e.target.value })}
                  className="mt-1"
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setLines((ls) => [
            ...ls,
            {
              key: `new-${Date.now()}`,
              name: "",
              quantity: "1",
              price: "0.00",
            },
          ])
        }
      >
        <Plus className="size-4" /> Add a line
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm font-medium">
          Transport ($)
          <Input
            inputMode="decimal"
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            className="mt-1"
          />
        </label>
        <label className="text-sm font-medium">
          Discount ($)
          <Input
            inputMode="decimal"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="mt-1"
          />
        </label>
      </div>

      <div className="bg-muted/60 rounded-xl px-4 py-3 text-sm">
        {totals ? (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-muted-foreground">
              Subtotal {money(totals.subtotal)}
            </span>
            <span
              className={
                totals.total < 0
                  ? "font-semibold text-red-600"
                  : "font-semibold"
              }
            >
              New total {money(Math.max(0, totals.total))}
            </span>
          </div>
        ) : (
          <span className="text-amber-700">
            Every line needs a description, a whole quantity and a price like
            12.50.
          </span>
        )}
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Note printed on the invoice</span>
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Why it changed</span>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. 2 extra days agreed in chat"
        />
        <span className="text-muted-foreground block text-xs">
          The customer sees this with the updated invoice.
        </span>
      </label>
      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={sendToChat}
          onChange={(e) => setSendToChat(e.target.checked)}
          className="accent-primary size-4"
        />
        Post the updated invoice to the customer&apos;s chat
      </label>

      <div className="grid gap-2">
        <Button
          onClick={save}
          variant="gradient"
          loading={pending}
          disabled={!totals || totals.total < 0 || reason.trim().length < 3}
          className="w-full"
        >
          Save invoice
        </Button>
        <Button
          onClick={resend}
          variant="outline"
          loading={pending}
          className="w-full"
        >
          <Send className="size-4" /> Send current invoice to chat
        </Button>
      </div>
    </div>
  );
}
