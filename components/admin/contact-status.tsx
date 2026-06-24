"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { setContactStatus, deleteContact } from "@/server/actions/admin-crm";
import { toast } from "@/components/ui/toaster";
import { Select } from "@/components/ui/select";

export function ContactStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={status}
        disabled={pending}
        className="h-9 w-40"
        onChange={(e) =>
          start(async () => {
            const res = await setContactStatus(id, e.target.value);
            if (res.ok) router.refresh();
            else toast.error(res.error ?? "Failed");
          })
        }
      >
        <option value="NEW">New</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="RESOLVED">Resolved</option>
      </Select>
      <button
        type="button"
        disabled={pending}
        aria-label="Delete inquiry"
        title="Delete inquiry"
        onClick={() => {
          if (!confirm("Delete this inquiry?")) return;
          start(async () => {
            const res = await deleteContact(id);
            if (res.ok) {
              toast.success("Deleted");
              router.refresh();
            } else toast.error(res.error ?? "Failed");
          });
        }}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
