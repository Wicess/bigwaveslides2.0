"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerCrm } from "@/server/actions/admin-crm";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function CrmForm({
  id,
  notes,
  tags,
}: {
  id: string;
  notes: string;
  tags: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [crmNotes, setNotes] = useState(notes);
  const [tagStr, setTagStr] = useState(tags.join(", "));

  const save = () =>
    start(async () => {
      const res = await updateCustomerCrm({ id, crmNotes, tags: tagStr });
      if (res.ok) {
        toast.success("Saved");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Tags (comma-separated)</span>
        <Input value={tagStr} onChange={(e) => setTagStr(e.target.value)} placeholder="VIP, school, repeat" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Internal notes</span>
        <Textarea rows={5} value={crmNotes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Button onClick={save} variant="gradient" loading={pending} className="w-full">
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
