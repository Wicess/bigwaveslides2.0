"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBooking } from "@/server/actions/admin-bookings";
import { toast } from "@/components/ui/toaster";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const BOOKING_STATUS = ["REQUESTED", "CONFIRMED", "COMPLETED", "DECLINED", "CANCELLED"];
const PAYMENT_STATUS = ["PENDING", "INVOICE_SENT", "DEPOSIT_PAID", "PAID_IN_FULL", "CANCELLED"];

export function BookingControls({
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
      const res = await updateBooking({ id, status: s, paymentStatus: p, invoiceNote: note });
      if (res.ok) {
        toast.success("Booking updated");
        router.refresh();
      } else {
        toast.error(res.error ?? "Update failed");
      }
    });

  return (
    <div className="space-y-4">
      {s !== "CONFIRMED" && status !== "CONFIRMED" ? (
        <p className="rounded-[var(--radius-sm)] bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Confirming locks the dates (HARD hold) and marks the contract as sent.
        </p>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Booking status</span>
        <Select value={s} onChange={(e) => setS(e.target.value)}>
          {BOOKING_STATUS.map((o) => (
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
