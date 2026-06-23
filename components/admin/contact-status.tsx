"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setContactStatus } from "@/server/actions/admin-crm";
import { toast } from "@/components/ui/toaster";
import { Select } from "@/components/ui/select";

export function ContactStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
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
  );
}
