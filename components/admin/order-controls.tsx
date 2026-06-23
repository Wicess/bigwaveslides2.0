"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrder } from "@/server/actions/admin-orders";
import { toast } from "@/components/ui/toaster";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ORDER_STATUS = ["PENDING", "PROCESSING", "FULFILLED", "CANCELLED"];
const PAYMENT_STATUS = ["PENDING", "INVOICE_SENT", "DEPOSIT_PAID", "PAID_IN_FULL", "CANCELLED"];

export function OrderControls({
  id,
  status,
  paymentStatus,
  invoiceNote,
}: {
  id: string;
  status: string;
  paymentStatus: string;
  invoiceNote: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [s, setS] = useState(status);
  const [p, setP] = useState(paymentStatus);
  const [note, setNote] = useState(invoiceNote ?? "");

  const save = () =>
    startTransition(async () => {
      const res = await updateOrder({ id, status: s, paymentStatus: p, invoiceNote: note });
      if (res.ok) {
        toast.success("Order updated");
        router.refresh();
      } else {
        toast.error(res.error ?? "Update failed");
      }
    });

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Order status</span>
        <Select value={s} onChange={(e) => setS(e.target.value)}>
          {ORDER_STATUS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Payment status</span>
        <Select value={p} onChange={(e) => setP(e.target.value)}>
          {PAYMENT_STATUS.map((o) => (
            <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Invoice / internal note</span>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <Button onClick={save} variant="gradient" loading={pending} className="w-full">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
