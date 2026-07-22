"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BadgeCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  choosePaymentPlan,
  submitPaymentProof,
  uploadProofScreenshot,
} from "@/server/actions/order-flow";
import {
  amountDueCents,
  balanceCents,
  cryptoDiscountCents,
  effectiveTotalCents,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { paymentLogo } from "@/lib/payment-logos";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

type Details = {
  label: string;
  destination: string;
  instructions: string | null;
  network: string | null;
  qrUrl: string | null;
};

export function InvoicePayment({
  orderNumber,
  email,
  locale,
  totalCents,
  plan,
  methodKey,
  state,
  details,
  methods,
}: {
  orderNumber: string;
  email: string;
  locale: string;
  totalCents: number;
  plan: PaymentPlan | null;
  /** Rail already chosen on the order (null until stage A completes). */
  methodKey: string | null;
  /** paymentDetailsState from the order. */
  state: string;
  details: Details | null;
  methods: { method: string; label: string }[];
}) {
  const t = useTranslations("OrderFlow");
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [chosenPlan, setChosenPlan] = React.useState<PaymentPlan | null>(plan);
  const [method, setMethod] = React.useState<string | null>(methodKey);

  const money = (c: number) => formatPrice(c, locale);
  // Crypto takes 7% off the whole invoice — reflect it live as the client
  // toggles methods so the saving is impossible to miss.
  const pickDiscount = cryptoDiscountCents(totalCents, method);
  const payable = effectiveTotalCents(totalCents, method);
  const half = amountDueCents("HALF", payable);
  const halfBalance = balanceCents("HALF", payable);
  // Amounts for the post-choice stages use the rail stored on the order.
  const storedPayable = effectiveTotalCents(totalCents, methodKey);
  const storedDiscount = cryptoDiscountCents(totalCents, methodKey);
  const dueNow = plan ? amountDueCents(plan, storedPayable) : null;

  /* ── Stage C/D/E: details present, proof submitted, or paid ── */
  if (state === "PAID") {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        <p className="font-display flex items-center gap-2 text-lg font-bold">
          <BadgeCheck className="size-5" /> {t("paidTitle")}
        </p>
        <p className="mt-1 text-sm leading-relaxed">{t("paidBody")}</p>
      </div>
    );
  }

  if (
    details &&
    (state === "DETAILS_SENT" ||
      state === "PROOF_SUBMITTED" ||
      state === "REJECTED")
  ) {
    return (
      <PaymentDetailsCard
        orderNumber={orderNumber}
        details={details}
        methodKey={methodKey}
        amountLabel={dueNow != null ? money(dueNow) : money(storedPayable)}
        balanceLabel={
          plan === "HALF" ? money(balanceCents(plan, storedPayable)) : null
        }
        discountLabel={storedDiscount ? `−${money(storedDiscount)}` : null}
        state={state}
      />
    );
  }

  /* ── Stage B: plan chosen but owner still assigning details ── */
  if (plan && state === "AWAITING_DETAILS") {
    return <AwaitingDetails orderNumber={orderNumber} email={email} />;
  }

  /* ── Stage A: choose plan + method ── */
  const submit = () => {
    if (!chosenPlan || !method) return;
    startTransition(async () => {
      const res = await choosePaymentPlan({
        orderNumber,
        plan: chosenPlan,
        method,
      });
      if (res.ok) {
        toast.success(
          res.hasDetails ? t("detailsReadyToast") : t("detailsSoonToast"),
        );
        router.refresh();
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <div className="border-border rounded-2xl border p-5 sm:p-6">
      <p className="font-display text-lg font-bold">{t("choosePlanTitle")}</p>
      <p className="text-muted-foreground mt-1 text-sm">
        {t("choosePlanDesc")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(
          [
            {
              key: "HALF" as const,
              title: t("planHalfTitle"),
              amount: money(half),
              desc: t("planHalfDesc", { balance: money(halfBalance) }),
            },
            {
              key: "FULL" as const,
              title: t("planFullTitle"),
              amount: money(payable),
              desc: t("planFullDesc"),
            },
          ] as const
        ).map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setChosenPlan(p.key)}
            aria-pressed={chosenPlan === p.key}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              chosenPlan === p.key
                ? "border-primary ring-primary/30 bg-primary/5 ring-2"
                : "border-border hover:border-primary/50",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{p.title}</span>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border",
                  chosenPlan === p.key
                    ? "border-primary bg-primary text-white"
                    : "border-border",
                )}
              >
                {chosenPlan === p.key ? (
                  <CheckCircle2 className="size-4" />
                ) : null}
              </span>
            </span>
            <span className="mt-1 block">
              <span className="text-primary font-display text-xl font-bold">
                {p.amount}
              </span>
              {pickDiscount ? (
                <span className="text-muted-foreground ml-2 text-sm line-through">
                  {money(
                    p.key === "FULL"
                      ? totalCents
                      : amountDueCents("HALF", totalCents),
                  )}
                </span>
              ) : null}
            </span>
            <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
              {p.desc}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm font-semibold">{t("chooseMethodTitle")}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {methods.map((m) => {
          const logo = paymentLogo(m.method);
          const isCrypto = m.method === "crypto";
          return (
            <button
              key={m.method}
              type="button"
              onClick={() => setMethod(m.method)}
              aria-pressed={method === m.method}
              className={cn(
                "relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all",
                method === m.method
                  ? "border-primary ring-primary/30 bg-primary/5 ring-2"
                  : "border-border hover:border-primary/50",
              )}
            >
              {isCrypto ? (
                <span className="absolute -top-2 right-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                  −7%
                </span>
              ) : null}
              {logo ? (
                <Image
                  src={logo}
                  alt=""
                  width={56}
                  height={24}
                  className="h-5 w-auto max-w-14 object-contain sm:h-6"
                />
              ) : (
                <Wallet className="text-muted-foreground size-5" />
              )}
              <span className="text-[10px] leading-tight font-semibold sm:text-[11px]">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
      {pickDiscount ? (
        <p className="mt-2.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          🎉{" "}
          {t("cryptoApplied", {
            amount: money(pickDiscount),
            total: money(payable),
          })}
        </p>
      ) : null}

      <Button
        size="lg"
        variant="gradient"
        className="mt-5 w-full sm:w-auto"
        disabled={!chosenPlan || !method || pending}
        onClick={submit}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CreditCard className="size-4" />
        )}
        {t("getPaymentDetails")}
      </Button>
      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
        {t("noAutoCharge")}
      </p>
    </div>
  );
}

/* ───────────── Waiting state — honest, live, reassuring ───────────── */

function AwaitingDetails({
  orderNumber,
  email,
}: {
  orderNumber: string;
  email: string;
}) {
  const t = useTranslations("OrderFlow");
  const router = useRouter();
  const [elapsed, setElapsed] = React.useState(0);
  const [lastCheck, setLastCheck] = React.useState<number | null>(null);
  const startRef = React.useRef(Date.now());

  // Live elapsed timer — proof that time is really passing, not a stuck page.
  React.useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  // Slow fallback polling — the global <PaymentWatcher /> (mounted in the
  // locale layout) already checks every 6s and feeds us via the
  // bws:payment-poll / bws:payment-ready events below. This local loop only
  // covers the case where localStorage is unavailable (so the watcher never
  // armed) — hence 30s, not 6s, to avoid doubling request volume.
  React.useEffect(() => {
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(
          `/api/orders/${orderNumber}/status?email=${encodeURIComponent(email)}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as { hasDetails?: boolean };
        if (!stopped) {
          setLastCheck(Date.now());
          if (data.hasDetails) router.refresh();
        }
      } catch {
        /* transient network error — next tick will retry */
      }
    };
    check();
    const id = setInterval(check, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [orderNumber, email, router]);

  // The global payment watcher also checks in the background — surface its
  // checks on the same heartbeat so "last checked" reflects every real poll.
  React.useEffect(() => {
    const onPoll = (e: Event) => {
      const d = (e as CustomEvent<{ orderNumber?: string; at?: number }>)
        .detail;
      if (d?.orderNumber === orderNumber) setLastCheck(d.at ?? Date.now());
    };
    const onReady = (e: Event) => {
      const d = (e as CustomEvent<{ orderNumber?: string }>).detail;
      if (d?.orderNumber === orderNumber) router.refresh();
    };
    window.addEventListener("bws:payment-poll", onPoll);
    window.addEventListener("bws:payment-ready", onReady);
    return () => {
      window.removeEventListener("bws:payment-poll", onPoll);
      window.removeEventListener("bws:payment-ready", onReady);
    };
  }, [orderNumber, router]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const checkedAgo =
    lastCheck == null ? null : Math.round((Date.now() - lastCheck) / 1000);

  return (
    <div className="border-border rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-bold">{t("awaitTitle")}</p>
        <span className="text-primary bg-primary/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
          <ShieldCheck className="size-3.5" /> {t("awaitBadge")}
        </span>
      </div>

      <ul className="mt-4 space-y-3 text-sm">
        <li
          className="flex items-center gap-2.5 motion-safe:animate-[await-item_0.5s_ease-out_both]"
          style={{ animationDelay: "0s" }}
        >
          <CheckCircle2 className="size-4.5 text-emerald-500" />
          {t("awaitStep1")}
        </li>
        <li
          className="flex items-center gap-2.5 motion-safe:animate-[await-item_0.5s_ease-out_both]"
          style={{ animationDelay: "0.35s" }}
        >
          <CheckCircle2 className="size-4.5 text-emerald-500" />
          {t("awaitStep2")}
        </li>
        <li
          className="flex items-start gap-2.5 motion-safe:animate-[await-item_0.5s_ease-out_both]"
          style={{ animationDelay: "0.7s" }}
        >
          <span className="relative mt-0.5 grid size-4.5 place-items-center">
            <span className="bg-primary absolute size-2.5 animate-ping rounded-full opacity-40 [animation-duration:2.6s]" />
            <span className="bg-primary relative size-2.5 rounded-full" />
          </span>
          <span>
            <span className="font-semibold">{t("awaitStep3")}</span>
            <span className="text-muted-foreground border-border ml-2 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
              {t("awaitEta")}
            </span>
            <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
              {t("awaitStep3Desc")}
            </span>
          </span>
        </li>
      </ul>

      {/* Indeterminate scan bar — honest: no fake percentage. */}
      <div className="bg-muted mt-4 h-1.5 overflow-hidden rounded-full">
        <div className="bg-primary/70 h-full w-1/3 animate-[scan_1.8s_ease-in-out_infinite] rounded-full" />
      </div>
      <style>{`@keyframes scan{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}@keyframes await-item{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>

      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span>
          {t("awaitElapsed")} {mm}:{ss}
        </span>
        {checkedAgo != null ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {checkedAgo <= 3
              ? t("checkedJustNow")
              : t("checkedAgo", { s: checkedAgo })}
          </span>
        ) : null}
      </div>

      <p className="border-border bg-muted/50 mt-4 rounded-xl border p-3.5 text-xs leading-relaxed">
        {t("awaitNote")}
      </p>
    </div>
  );
}

/* ───────────── Details card + payment proof ───────────── */

function PaymentDetailsCard({
  orderNumber,
  details,
  methodKey,
  amountLabel,
  balanceLabel,
  discountLabel,
  state,
}: {
  orderNumber: string;
  details: Details;
  methodKey: string | null;
  amountLabel: string;
  balanceLabel: string | null;
  /** e.g. "−$43.26" when the 7% crypto discount applies. */
  discountLabel: string | null;
  state: string;
}) {
  const t = useTranslations("OrderFlow");
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [txId, setTxId] = React.useState("");
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [highlight, setHighlight] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  /* ── Arrival announcement — the details must never appear silently ── */

  const announcedRef = React.useRef(false);
  // Tab-title flash bookkeeping lives in a ref so cleanup can always restore
  // the original title, and so a strict-mode remount can resume the flash.
  const flashRef = React.useRef<{
    interval: ReturnType<typeof setInterval> | null;
    original: string | null;
    until: number;
  }>({ interval: null, original: null, until: 0 });

  const stopTitleFlash = React.useCallback(() => {
    const f = flashRef.current;
    if (f.interval) {
      clearInterval(f.interval);
      f.interval = null;
    }
    if (f.original != null) {
      document.title = f.original;
      f.original = null;
    }
    window.removeEventListener("focus", stopTitleFlash);
  }, []);

  const startTitleFlash = React.useCallback(() => {
    const f = flashRef.current;
    if (f.interval || document.hasFocus()) return;
    f.original = document.title;
    let alternate = false;
    f.interval = setInterval(() => {
      if (Date.now() >= f.until) {
        stopTitleFlash();
        return;
      }
      alternate = !alternate;
      document.title = alternate
        ? t("tabTitleFlash")
        : (f.original ?? document.title);
    }, 900);
    window.addEventListener("focus", stopTitleFlash);
  }, [stopTitleFlash, t]);

  const announce = React.useCallback(() => {
    if (announcedRef.current) return;
    announcedRef.current = true;
    // Consume the watcher's one-shot marker ONLY here, behind the ref guard —
    // reading + deleting it in a bare effect body dies under React's dev
    // double-invoke (first discarded pass eats the marker, its cleanup kills
    // the timer, and nothing ever fires).
    try {
      if (sessionStorage.getItem("bws_payment_announce") === orderNumber) {
        sessionStorage.removeItem("bws_payment_announce");
      }
      // Latch per order so a later fresh mount (reopening the emailed link
      // while still DETAILS_SENT) doesn't replay the full arrival fanfare.
      sessionStorage.setItem(`bws_announced:${orderNumber}`, "1");
    } catch {
      /* storage unavailable — announce anyway */
    }
    toast.success(t("readyToastTitle"), {
      description: t("readyToastDesc"),
      duration: 10000,
    });
    setHighlight(true);
    window.setTimeout(() => setHighlight(false), 2600);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    navigator.vibrate?.([90, 60, 90]);
    flashRef.current.until = Date.now() + 30000;
    startTitleFlash();
  }, [orderNumber, startTitleFlash, t]);

  React.useEffect(() => {
    // (a) watcher marker present → announce (consumed inside announce()).
    // (c) fallback: first mount right after the state transition — skipped
    //     when the per-order session latch shows we already announced, so
    //     reopening the page later in the same session stays quiet. Both
    //     funnel through the single announcedRef so nothing double-fires.
    //     Reloads of later states (proof submitted / rejected) stay quiet.
    let marker: string | null = null;
    let latched = false;
    try {
      marker = sessionStorage.getItem("bws_payment_announce");
      latched = sessionStorage.getItem(`bws_announced:${orderNumber}`) === "1";
    } catch {
      /* ignore */
    }
    if (
      !announcedRef.current &&
      (marker === orderNumber || (state === "DETAILS_SENT" && !latched))
    ) {
      announce();
    } else if (announcedRef.current && flashRef.current.until > Date.now()) {
      // Strict-mode remount: the discarded pass's cleanup stopped the flash.
      startTitleFlash();
    }
    // (b) the global watcher saw hasDetails flip while we're mounted.
    const onReady = (e: Event) => {
      const d = (e as CustomEvent<{ orderNumber?: string }>).detail;
      if (d?.orderNumber === orderNumber) announce();
    };
    window.addEventListener("bws:payment-ready", onReady);
    return () => {
      window.removeEventListener("bws:payment-ready", onReady);
      stopTitleFlash(); // always restore the original tab title
    };
  }, [announce, orderNumber, startTitleFlash, state, stopTitleFlash]);

  /* ── Proof screenshot picking ── */

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error(t("proofFileTooLarge"));
      return;
    }
    setProofFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const removeFile = () => {
    setProofFile(null);
    setPreviewUrl(null);
  };

  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error("Copy failed");
    }
  };

  const submitProof = () =>
    startTransition(async () => {
      // Upload the screenshot first; a failed upload never blocks the proof —
      // they can still submit with just the transaction ID.
      let proofImageUrl: string | undefined;
      if (proofFile) {
        try {
          const fd = new FormData();
          fd.append("file", proofFile);
          fd.append("orderNumber", orderNumber);
          const up = await uploadProofScreenshot(fd);
          if (up.ok && up.url) proofImageUrl = up.url;
          else {
            toast.error(t("proofUploadFailed"), {
              description: t("proofUploadFailedDesc"),
            });
          }
        } catch {
          toast.error(t("proofUploadFailed"), {
            description: t("proofUploadFailedDesc"),
          });
        }
      }
      const res = await submitPaymentProof({
        orderNumber,
        txId: txId || undefined,
        proofImageUrl,
      });
      if (res.ok) {
        toast.success(t("proofToast"));
        router.refresh();
      } else toast.error(res.error ?? "Something went wrong.");
    });

  const proofSubmitted = state === "PROOF_SUBMITTED";

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-2xl border p-5 transition-all duration-700 ease-out sm:p-6",
        highlight
          ? "border-primary/60 ring-primary/30 shadow-primary/10 shadow-lg ring-4"
          : "border-border ring-primary/0 ring-0",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display min-w-0 text-lg font-bold">
          {t("detailsTitle")}
        </p>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            highlight && "motion-safe:animate-pulse",
          )}
        >
          <ShieldCheck className="size-3.5" /> {t("detailsBadge")}
        </span>
      </div>

      <dl className="mt-4 space-y-2.5 text-sm">
        {discountLabel ? (
          <Row k={t("cryptoDiscountRow")}>
            <span className="font-semibold text-emerald-600">
              {discountLabel}
            </span>
          </Row>
        ) : null}
        <Row k={t("amountDueNow")}>
          <span className="text-primary font-display text-xl font-bold">
            {amountLabel}
          </span>
        </Row>
        {balanceLabel ? (
          <Row k={t("balanceBeforeSetup")}>{balanceLabel}</Row>
        ) : null}
        <Row k={t("method")}>
          <span className="inline-flex items-center gap-1.5">
            {methodKey && paymentLogo(methodKey) ? (
              <Image
                src={paymentLogo(methodKey)!}
                alt=""
                width={40}
                height={16}
                className="h-4 w-auto object-contain"
              />
            ) : null}
            {details.label}
          </span>
        </Row>
        <Row k={t("sendTo")}>
          {/* The whole value is the tap target — one thumb-tap copies it. */}
          <button
            type="button"
            onClick={() => copy(details.destination)}
            aria-label={`${t("sendTo")} — copy`}
            className="border-border hover:border-primary hover:text-primary inline-flex min-h-10 max-w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors active:scale-[0.98]"
          >
            <span className="truncate font-mono font-semibold">
              {details.destination}
            </span>
            <Copy className="text-muted-foreground size-4 shrink-0" />
          </button>
        </Row>
        {details.network ? <Row k={t("network")}>{details.network}</Row> : null}
        <Row k={t("reference")}>
          <span className="font-mono font-semibold">{orderNumber}</span>
        </Row>
      </dl>

      {details.instructions ? (
        <p className="border-primary/20 bg-primary/5 mt-4 rounded-xl border p-3.5 text-sm leading-relaxed">
          {details.instructions}
        </p>
      ) : null}

      {details.qrUrl ? (
        <div className="mt-4 flex justify-center sm:justify-start">
          <Image
            src={details.qrUrl}
            alt="Payment QR code"
            width={160}
            height={160}
            className="rounded-xl border"
          />
        </div>
      ) : null}

      {proofSubmitted ? (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-semibold">{t("proofPendingTitle")}</p>
          <p className="mt-1 leading-relaxed">{t("proofPendingBody")}</p>
        </div>
      ) : (
        <div className="border-border mt-5 border-t pt-4">
          <p className="text-sm font-semibold">{t("proofTitle")}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder={t("proofPlaceholder")}
              className="min-w-0 sm:max-w-xs"
            />
            <Button variant="gradient" disabled={pending} onClick={submitProof}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BadgeCheck className="size-4" />
              )}
              {t("proofCta")}
            </Button>
          </div>

          {previewUrl && proofFile ? (
            <div className="border-border mt-2.5 flex min-w-0 items-center gap-2.5 rounded-xl border p-2 sm:max-w-xs">
              {/* Local object-URL preview — next/image can't optimize blobs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="size-11 shrink-0 rounded-lg border object-cover"
              />
              <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                {proofFile.name}
              </span>
              <button
                type="button"
                onClick={removeFile}
                aria-label={t("proofRemoveImage")}
                className="text-muted-foreground hover:text-foreground shrink-0 p-1"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            // Dashed upload zone — camera or gallery, easy thumb hit.
            <label className="border-border text-muted-foreground hover:border-primary hover:text-primary mt-2.5 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-sm font-medium transition-colors sm:w-auto sm:justify-start">
              <ImagePlus className="size-4 shrink-0" />
              {t("proofScreenshotCta")}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={pickFile}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground shrink-0">{k}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
