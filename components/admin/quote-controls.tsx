"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuote } from "@/server/actions/admin-quotes";
import { toast } from "@/components/ui/toaster";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const QUOTE_STATUS = ["NEW", "REVIEWED", "QUOTED", "WON", "LOST"];

export function QuoteControls({
  id,
  status,
  estimateCents,
  staffNotes,
}: {
  id: string;
  status: string;
  estimateCents: number | null;
  staffNotes: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [s, setS] = useState(status);
  const [estimate, setEstimate] = useState(
    estimateCents != null ? String(estimateCents / 100) : "",
  );
  const [notes, setNotes] = useState(staffNotes ?? "");

  const save = () =>
    startTransition(async () => {
      const res = await updateQuote({ id, status: s, estimate, staffNotes: notes });
      if (res.ok) {
        toast.success("Quote updated");
        router.refresh();
      } else {
        toast.error(res.error ?? "Update failed");
      }
    });

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Status</span>
        <Select value={s} onChange={(e) => setS(e.target.value)}>
          {QUOTE_STATUS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Estimate ($)</span>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={estimate}
          onChange={(e) => setEstimate(e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Staff notes</span>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Button onClick={save} variant="gradient" loading={pending} className="w-full">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
