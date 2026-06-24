"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, UserMinus, UserCheck } from "lucide-react";
import { setSubscriberStatus, deleteSubscriber } from "@/server/actions/admin-crm";
import { toast } from "@/components/ui/toaster";
import { Card } from "@/components/ui/card";

export type SubscriberRow = {
  id: string;
  email: string;
  source: string | null;
  status: string;
  createdAt: string; // pre-formatted
  createdAtISO: string;
};

export function NewsletterTable({ subscribers }: { subscribers: SubscriberRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(ok);
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });

  const exportCsv = () => {
    const header = "email,status,source,joined\n";
    const rows = subscribers
      .map((s) => `"${s.email}","${s.status}","${s.source ?? ""}","${s.createdAtISO}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40"
        >
          <Download className="size-4" /> Export CSV
        </button>
      </div>
      <Card className="overflow-hidden p-0">
        {subscribers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map((s) => {
                  const subscribed = s.status === "SUBSCRIBED";
                  return (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{s.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.source ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            subscribed
                              ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                              : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          }
                        >
                          {subscribed ? "Subscribed" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.createdAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={pending}
                            title={subscribed ? "Mark unsubscribed" : "Re-subscribe"}
                            aria-label={subscribed ? "Mark unsubscribed" : "Re-subscribe"}
                            onClick={() =>
                              run(
                                () =>
                                  setSubscriberStatus(
                                    s.id,
                                    subscribed ? "UNSUBSCRIBED" : "SUBSCRIBED",
                                  ),
                                "Updated",
                              )
                            }
                            className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
                          >
                            {subscribed ? (
                              <UserMinus className="size-4" />
                            ) : (
                              <UserCheck className="size-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            title="Delete subscriber"
                            aria-label="Delete subscriber"
                            onClick={() => {
                              if (!confirm(`Delete ${s.email}?`)) return;
                              run(() => deleteSubscriber(s.id), "Deleted");
                            }}
                            className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
