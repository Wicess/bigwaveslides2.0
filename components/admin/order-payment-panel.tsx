"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CreditCard, Loader2, Send, XCircle } from "lucide-react";
import {
  postOrderPaymentDetails,
  markOrderPaid,
  rejectOrderProof,
} from "@/server/actions/admin-payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<string, string> = {
  AWAITING_DETAILS: "Awaiting payment details",
  DETAILS_SENT: "Details sent — awaiting payment",
  PROOF_SUBMITTED: "Proof submitted — verify!",
  PAID: "Paid",
  REJECTED: "Proof rejected — client resubmitting",
};

const STATE_STYLE: Record<string, string> = {
  AWAITING_DETAILS: "bg-amber-100 text-amber-700",
  DETAILS_SENT: "bg-sky-100 text-sky-700",
  PROOF_SUBMITTED: "bg-purple-100 text-purple-700",
  PAID: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function OrderPaymentPanel({
  orderId,
  stage,
  plan,
  state,
  methodKey,
  methodLabel,
  destination,
  proofTxId,
  proofImageUrl,
  methods,
}: {
  orderId: string;
  stage: string;
  plan: string | null;
  state: string;
  methodKey: string | null;
  methodLabel: string | null;
  destination: string | null;
  proofTxId: string | null;
  proofImageUrl: string | null;
  methods: { method: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [method, setMethod] = React.useState(methodKey ?? "zelle");
  const [dest, setDest] = React.useState("");
  const [qr, setQr] = React.useState("");
  const [reason, setReason] = React.useState("");

  const run = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    okMsg: string,
  ) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(okMsg);
        router.refresh();
      } else toast.error(res.error ?? "Something went wrong.");
    });

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase",
            STATE_STYLE[state] ?? "bg-muted text-muted-foreground",
          )}
        >
          {STATE_LABEL[state] ?? state}
        </span>
        <span className="text-muted-foreground text-xs">
          Stage: {stage}
          {plan ? ` · Plan: ${plan === "HALF" ? "50% deposit" : "Full"}` : ""}
          {methodLabel ? ` · ${methodLabel}` : ""}
        </span>
      </div>

      {destination ? (
        <p className="text-muted-foreground text-xs">
          Details on file: <span className="font-mono">{destination}</span>
        </p>
      ) : null}
      {proofTxId ? (
        <p className="text-muted-foreground text-xs">
          Client&apos;s payment reference:{" "}
          <span className="font-mono">{proofTxId}</span>
        </p>
      ) : null}
      {proofImageUrl ? (
        <a
          href={proofImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border inline-block overflow-hidden rounded-lg border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofImageUrl}
            alt="Payment proof screenshot uploaded by the client"
            className="h-28 w-auto max-w-full object-cover"
          />
        </a>
      ) : null}

      {/* Post details — the urgent action when a client is waiting. */}
      {state === "AWAITING_DETAILS" || state === "REJECTED" || !destination ? (
        <div className="border-border space-y-2 rounded-xl border p-3">
          <p className="text-xs font-bold tracking-wide uppercase">
            Post payment details
          </p>
          <div className="flex flex-wrap gap-1.5">
            {methods.map((m) => (
              <button
                key={m.method}
                type="button"
                onClick={() => setMethod(m.method)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium",
                  method === m.method
                    ? "border-primary bg-primary text-white"
                    : "border-border",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            placeholder="Destination — handle / tag / address"
          />
          <Input
            value={qr}
            onChange={(e) => setQr(e.target.value)}
            placeholder="QR image URL (optional)"
          />
          <Button
            size="sm"
            variant="gradient"
            disabled={pending || dest.trim().length < 2}
            onClick={() =>
              run(
                () =>
                  postOrderPaymentDetails({
                    orderId,
                    method,
                    destination: dest.trim(),
                    qrImageUrl: qr.trim() || undefined,
                  }),
                "Details posted & emailed — client's page reveals them within seconds.",
              )
            }
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Post & email details
          </Button>
        </div>
      ) : null}

      {/* Verify / reject */}
      {state !== "PAID" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => markOrderPaid({ orderId }),
                "Marked paid — confirmation emailed to the client.",
              )
            }
          >
            <BadgeCheck className="size-4" /> Mark paid
          </Button>
          {state === "PROOF_SUBMITTED" ? (
            <>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reject reason (optional)"
                className="h-9 max-w-[220px]"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(
                    () =>
                      rejectOrderProof({
                        orderId,
                        reason: reason.trim() || undefined,
                      }),
                    "Proof rejected — client notified to recheck.",
                  )
                }
              >
                <XCircle className="size-4" /> Reject proof
              </Button>
            </>
          ) : null}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 font-semibold text-emerald-600">
          <CreditCard className="size-4" /> Payment recorded.
        </p>
      )}
    </div>
  );
}
