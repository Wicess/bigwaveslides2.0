"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, Loader2, Send, XCircle } from "lucide-react";
import {
  postOrderPaymentDetails,
  markOrderPaid,
  rejectOrderProof,
} from "@/server/actions/admin-payments";
import { amountDueCents, type PaymentPlan } from "@/lib/payment-plan";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

// State chips stay within the warm admin vocabulary: amber = you owe an
// action, primary tint = client owes an action, emerald = done, red = attention.
const STATES: Record<string, { label: string; cls: string }> = {
  AWAITING_DETAILS: {
    label: "Needs payment details",
    cls: "bg-amber-100 text-amber-800",
  },
  DETAILS_SENT: {
    label: "Details sent — awaiting payment",
    cls: "bg-primary-50 text-primary-800",
  },
  PROOF_SUBMITTED: {
    label: "Proof submitted — verify now",
    cls: "text-white [background:var(--gradient-wave)]",
  },
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: {
    label: "Proof rejected — client resubmitting",
    cls: "bg-red-100 text-red-800",
  },
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
  totalCents,
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
  totalCents: number;
  methods: { method: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [method, setMethod] = React.useState(methodKey ?? "zelle");
  const [dest, setDest] = React.useState("");
  const [qr, setQr] = React.useState("");
  const [reason, setReason] = React.useState("");

  const paid = state === "PAID";
  const chip = STATES[state] ?? {
    label: state,
    cls: "bg-muted text-muted-foreground",
  };
  const dueNow = plan ? amountDueCents(plan as PaymentPlan, totalCents) : null;

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

  // The client's journey: Quote → Invoice → Paid.
  const journeyStep = stage === "QUOTE" ? 0 : paid ? 2 : 1;
  const journey = ["Quote", "Invoice", "Paid"];

  return (
    <div className="text-sm">
      {/* Journey */}
      <ol className="flex items-center gap-2">
        {journey.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                i < journeyStep
                  ? "bg-emerald-500 text-white"
                  : i === journeyStep
                    ? "text-white [background:var(--gradient-wave)]"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i < journeyStep ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                i === journeyStep ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < journey.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1",
                  i < journeyStep ? "bg-emerald-400" : "bg-border",
                )}
              />
            ) : null}
          </li>
        ))}
      </ol>

      {/* State + money summary */}
      <div className="bg-muted/50 mt-4 rounded-[var(--radius-sm)] p-3.5">
        <span
          className={cn(
            "inline-block rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase",
            chip.cls,
          )}
        >
          {chip.label}
        </span>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <dt className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Total
            </dt>
            <dd className="text-foreground font-display font-bold">
              {formatPrice(totalCents, "en")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Plan
            </dt>
            <dd className="text-foreground font-medium">
              {plan === "HALF" ? "50% now" : plan === "FULL" ? "Full" : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              {paid ? "Received" : "Due now"}
            </dt>
            <dd className="text-primary font-display font-bold">
              {dueNow != null ? formatPrice(dueNow, "en") : "—"}
            </dd>
          </div>
        </dl>
        {(methodLabel || destination) && (
          <p className="text-muted-foreground mt-2.5 text-xs">
            {methodLabel ?? methodKey}
            {destination ? (
              <>
                {" → "}
                <span className="text-foreground/80 font-mono">
                  {destination}
                </span>
              </>
            ) : null}
          </p>
        )}
      </div>

      {/* Client's proof */}
      {(proofTxId || proofImageUrl) && !paid ? (
        <div className="border-border/70 mt-4 rounded-[var(--radius-sm)] border p-3.5">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Client&apos;s proof of payment
          </p>
          {proofTxId ? (
            <p className="text-foreground/90 mt-1.5 font-mono text-xs">
              {proofTxId}
            </p>
          ) : null}
          {proofImageUrl ? (
            <a
              href={proofImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border mt-2 inline-block overflow-hidden rounded-[var(--radius-sm)] border transition-opacity hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofImageUrl}
                alt="Payment proof screenshot uploaded by the client"
                className="h-28 w-auto max-w-full object-cover"
              />
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Post details — the urgent action when a client is waiting */}
      {!paid && (state === "AWAITING_DETAILS" || !destination) ? (
        <div className="mt-4">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Post payment details
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {methods.map((m) => (
              <button
                key={m.method}
                type="button"
                onClick={() => setMethod(m.method)}
                aria-pressed={method === m.method}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                  method === m.method
                    ? "border-transparent text-white [background:var(--gradient-wave)]"
                    : "border-border text-foreground/70 hover:border-primary hover:text-primary",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-2.5 space-y-2">
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
          </div>
          <Button
            size="sm"
            variant="gradient"
            className="mt-2.5"
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
                "Details posted & emailed — the client's page reveals them within seconds.",
              )
            }
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Post &amp; email details
          </Button>
        </div>
      ) : null}

      {/* Verify / reject */}
      {!paid ? (
        <div className="border-border/70 mt-4 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="gradient"
              disabled={pending}
              onClick={() =>
                run(
                  () => markOrderPaid({ orderId }),
                  "Marked paid — confirmation emailed to the client.",
                )
              }
            >
              <BadgeCheck className="size-4" /> Mark paid
              {dueNow != null ? ` · ${formatPrice(dueNow, "en")}` : ""}
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
          <p className="text-muted-foreground mt-2 text-xs">
            Mark paid only after the money shows in the account — it emails the
            client their booking confirmation.
          </p>
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-1.5 font-semibold text-emerald-700">
          <BadgeCheck className="size-4" /> Payment recorded — booking
          confirmed.
        </p>
      )}
    </div>
  );
}
