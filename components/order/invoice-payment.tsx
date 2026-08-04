"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BadgeCheck,
  BellRing,
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
  discountLabelFor,
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

/* ── Arrival sound cue ──────────────────────────────────────────────────
   A short, pleasant two-note chime synthesised with the Web Audio API (no
   asset to download). This is the signal that reaches a client who's looking
   away — visuals alone are easy to miss. Browsers only allow audio after a
   user gesture, so AwaitingDetails unlocks the context on the client's first
   interaction while they wait; if they never interact the chime is silently
   skipped and the visual signals still fire. */
let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx) sharedAudioCtx = new Ctor();
  return sharedAudioCtx;
}

/** Best-effort: resume a suspended AudioContext from within a user gesture. */
function unlockAudio(): void {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

/** Play a rising two-note "ready" chime. No-op if audio isn't unlocked. */
function playArrivalChime(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  // A5 → D6, soft sine with a quick attack and gentle exponential release.
  for (const [freq, at] of [
    [880, 0],
    [1174.66, 0.15],
  ] as const) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.linearRampToValueAtTime(0.28, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + at);
    osc.stop(now + at + 0.55);
  }
}

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
  securityCode,
  manualMode = false,
  invoiceId,
  methodLabel,
  contactPhone,
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
  /** Per-order code shown here AND in the email — the client cross-checks. */
  securityCode: string;
  /** Manual invoice mode — details are sent by the owner, never shown on-site. */
  manualMode?: boolean;
  /** The Invoice ID the client verifies against (manual mode). */
  invoiceId?: string;
  /** Chosen method's label (manual mode display). */
  methodLabel?: string | null;
  /** Contact phone for the manual-mode "we'll reach you" line. */
  contactPhone?: string | null;
}) {
  const t = useTranslations("OrderFlow");
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  // Pre-select the 50% deposit — the lowest-friction way to lock the date — so
  // an accepted quote lands one tap (pick a method) from paying instead of two.
  const [chosenPlan, setChosenPlan] = React.useState<PaymentPlan | null>(
    plan ?? "HALF",
  );
  const [method, setMethod] = React.useState<string | null>(methodKey);

  const money = (c: number) => formatPrice(c, locale);
  // Crypto takes 11.5% off the whole invoice — reflect it live as the client
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

  // Manual invoice mode: once a plan + method are chosen, we never reveal
  // details on-site — the client verifies against their Invoice ID and the
  // owner sends the details by email / phone / WhatsApp.
  if (manualMode && plan) {
    return (
      <ManualInvoiceNotice
        orderNumber={orderNumber}
        invoiceId={invoiceId ?? orderNumber}
        methodLabel={methodLabel ?? details?.label ?? methodKey ?? ""}
        email={email}
        phone={contactPhone ?? null}
        amountLabel={dueNow != null ? money(dueNow) : money(storedPayable)}
        balanceLabel={
          plan === "HALF" ? money(balanceCents(plan, storedPayable)) : null
        }
        state={state}
      />
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
        securityCode={securityCode}
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
        // Move to the dedicated premium payment page for the waiting/reveal.
        router.push(`/${locale}/order/${orderNumber}/payment`);
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
      {/* One bordered list, divided rows — not six separate cards. */}
      <div className="border-border divide-border mt-2.5 divide-y overflow-hidden rounded-xl border">
        {methods.map((m) => {
          const logo = paymentLogo(m.method);
          const disc = discountLabelFor(m.method);
          const selected = method === m.method;
          return (
            <button
              key={m.method}
              type="button"
              onClick={() => setMethod(m.method)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors",
                selected ? "bg-primary/5" : "hover:bg-muted/40",
              )}
            >
              <span className="flex h-7 w-12 shrink-0 items-center">
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={48}
                    height={28}
                    className="max-h-6 w-auto max-w-full object-contain"
                  />
                ) : (
                  <Wallet className="text-muted-foreground size-6" />
                )}
              </span>
              <span className="flex-1 text-sm font-semibold">{m.label}</span>
              {disc ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {t("saveLabel", { pct: disc })}
                </span>
              ) : null}
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  selected ? "border-primary" : "border-border",
                )}
              >
                {selected ? (
                  <span className="bg-primary size-2.5 rounded-full" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {pickDiscount ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
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
        {manualMode ? t("continueManual") : t("getPaymentDetails")}
      </Button>
      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
        {manualMode ? t("noAutoChargeManual") : t("noAutoCharge")}
      </p>
    </div>
  );
}

/* ───────────── Waiting state — premium, minimal, secure ───────────── */

function AwaitingDetails({
  orderNumber,
  email,
}: {
  orderNumber: string;
  email: string;
}) {
  const t = useTranslations("OrderFlow");
  const router = useRouter();

  // Prime the audio context on the client's first interaction while they wait,
  // so the arrival chime is allowed to play the moment details land (browsers
  // block audio not tied to a gesture). Harmless if never triggered.
  React.useEffect(() => {
    const unlock = () => unlockAudio();
    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Slow fallback polling — the global <PaymentWatcher /> (mounted in the
  // locale layout) already checks every 6s and reveals via the
  // bws:payment-ready event below. This 30s loop only covers the case where
  // localStorage is unavailable (so the watcher never armed).
  React.useEffect(() => {
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(
          `/api/orders/${orderNumber}/status?email=${encodeURIComponent(email)}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as { hasDetails?: boolean };
        if (!stopped && data.hasDetails) router.refresh();
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

  React.useEffect(() => {
    const onReady = (e: Event) => {
      const d = (e as CustomEvent<{ orderNumber?: string }>).detail;
      if (d?.orderNumber === orderNumber) router.refresh();
    };
    window.addEventListener("bws:payment-ready", onReady);
    return () => window.removeEventListener("bws:payment-ready", onReady);
  }, [orderNumber, router]);

  return (
    <div className="flex flex-col items-center py-6 text-center">
      {/* Premium secure loader: a spinning gradient ring around a shield, with
          a soft pulsing halo — reads as "securely working", no fake progress. */}
      <div className="relative grid size-24 place-items-center">
        <span
          aria-hidden
          className="border-primary/15 absolute inset-0 rounded-full border-4"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-4 border-transparent [border-top-color:var(--color-primary)] [border-right-color:var(--color-primary)] [animation-duration:1.1s] motion-safe:animate-spin"
        />
        <span
          aria-hidden
          className="bg-primary/10 absolute inset-2 rounded-full [animation-duration:2.2s] motion-safe:animate-ping"
        />
        <ShieldCheck className="text-primary relative size-9" />
      </div>

      <p className="text-muted-foreground mt-5 max-w-xs text-sm leading-relaxed">
        {t("awaitBody")}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <ShieldCheck className="size-3.5" /> {t("awaitBadge")}
      </span>
    </div>
  );
}

/* ───────────── Details card + payment proof ───────────── */

function PaymentDetailsCard({
  orderNumber,
  details,
  methodKey,
  securityCode,
  amountLabel,
  balanceLabel,
  discountLabel,
  state,
}: {
  orderNumber: string;
  details: Details;
  methodKey: string | null;
  securityCode: string;
  amountLabel: string;
  balanceLabel: string | null;
  /** e.g. "−$71.04" when the crypto discount applies. */
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
  // A persistent (until dismissed) "details are ready" banner — unlike the
  // toast, it stays put so a client who looked away still sees it on return.
  const [justArrived, setJustArrived] = React.useState(false);
  // Every reveal runs a 3s "securing your channel" animation first, so the
  // details feel individually issued and verified rather than pre-baked.
  const [verifying, setVerifying] = React.useState(true);
  const verifyingRef = React.useRef(true);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      verifyingRef.current = false;
      setVerifying(false);
    }, 3000);
    return () => window.clearTimeout(id);
  }, []);

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
    setJustArrived(true);
    window.setTimeout(() => setHighlight(false), 2600);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Sound + haptics — the cues that reach a client looking away from the
    // screen. Both are best-effort and degrade silently where unsupported.
    playArrivalChime();
    navigator.vibrate?.([90, 60, 90, 60, 140]);
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
    // Hold the whole fanfare until the 3s security loader has finished, so the
    // chime/banner land exactly when the details actually appear.
    if (!verifying) {
      let marker: string | null = null;
      let latched = false;
      try {
        marker = sessionStorage.getItem("bws_payment_announce");
        latched =
          sessionStorage.getItem(`bws_announced:${orderNumber}`) === "1";
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
    }
    // (b) the global watcher saw hasDetails flip while we're mounted — but never
    // before the loader has revealed the details.
    const onReady = (e: Event) => {
      if (verifyingRef.current) return;
      const d = (e as CustomEvent<{ orderNumber?: string }>).detail;
      if (d?.orderNumber === orderNumber) announce();
    };
    window.addEventListener("bws:payment-ready", onReady);
    return () => {
      window.removeEventListener("bws:payment-ready", onReady);
      stopTitleFlash(); // always restore the original tab title
    };
  }, [
    announce,
    orderNumber,
    startTitleFlash,
    state,
    stopTitleFlash,
    verifying,
  ]);

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

  // 3-second security check before the details appear — reads as a live,
  // per-order verification rather than a page that was simply sitting there.
  if (verifying) {
    return (
      <div className="border-border rounded-2xl border p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="relative grid size-16 place-items-center">
            <span className="border-primary/30 absolute inset-0 rounded-full border-2" />
            <span className="border-primary absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-current [animation-duration:1.1s]" />
            <ShieldCheck className="text-primary size-7" />
          </span>
          <p className="font-display mt-4 text-lg font-bold">
            {t("secLoaderTitle")}
          </p>
          <ul className="mt-4 w-full max-w-xs space-y-2.5 text-left text-sm">
            {[
              t("secLoaderStep1"),
              t("secLoaderStep2"),
              t("secLoaderStep3"),
            ].map((s, i) => (
              <li
                key={s}
                className="text-foreground/80 flex items-center gap-2.5 motion-safe:animate-[secstep_0.5s_ease-out_both]"
                style={{ animationDelay: `${i * 0.9}s` }}
              >
                <CheckCircle2 className="size-4.5 shrink-0 text-emerald-500" />
                {s}
              </li>
            ))}
          </ul>
          <div className="bg-muted mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full">
            <div className="bg-primary/70 h-full w-1/3 animate-[scan_1.5s_ease-in-out_infinite] rounded-full" />
          </div>
          <p className="text-muted-foreground mt-4 max-w-xs text-xs leading-relaxed">
            {t("secLoaderNote")}
          </p>
        </div>
        <style>{`@keyframes secstep{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes scan{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}`}</style>
      </div>
    );
  }

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
      {/* Persistent arrival banner — stays until dismissed, so a client who
          glanced away still sees it when they look back. */}
      {justArrived ? (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-emerald-900 motion-safe:animate-[await-item_0.4s_ease-out_both] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          <BellRing className="size-5 shrink-0 motion-safe:animate-[wiggle_0.8s_ease-in-out_2]" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{t("readyToastTitle")}</p>
            <p className="text-sm leading-snug">{t("arrivedBannerDesc")}</p>
          </div>
          <button
            type="button"
            onClick={() => setJustArrived(false)}
            aria-label={t("arrivedBannerDismiss")}
            className="shrink-0 rounded-full p-1 text-emerald-700 transition-colors hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
          >
            <X className="size-4" />
          </button>
          <style>{`@keyframes wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}`}</style>
        </div>
      ) : null}

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

      {/* Anti-impersonation code — must match the client's email. Big + bold
          so it can't be misread. */}
      <div className="border-primary/30 bg-primary/5 mt-4 rounded-xl border p-4 text-center">
        <p className="text-muted-foreground text-[11px] font-bold tracking-[0.14em] uppercase">
          {t("securityCodeLabel")}
        </p>
        <p className="text-accent font-display mt-1 text-3xl font-extrabold tracking-[0.12em] tabular-nums sm:text-4xl">
          {securityCode}
        </p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-xs leading-relaxed">
          {t("securityCodeNote")}
        </p>
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

/* ───────── Manual invoice mode: no on-site details, verify by Invoice ID ───────── */

function ManualInvoiceNotice({
  orderNumber,
  invoiceId,
  methodLabel,
  email,
  phone,
  amountLabel,
  balanceLabel,
  state,
}: {
  orderNumber: string;
  invoiceId: string;
  methodLabel: string;
  email: string;
  phone: string | null;
  amountLabel: string;
  balanceLabel: string | null;
  state: string;
}) {
  const t = useTranslations("OrderFlow");
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [txId, setTxId] = React.useState("");
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const proofSubmitted = state === "PROOF_SUBMITTED";

  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

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

  const submitProof = () =>
    startTransition(async () => {
      let proofImageUrl: string | undefined;
      if (proofFile) {
        try {
          const fd = new FormData();
          fd.append("file", proofFile);
          fd.append("orderNumber", orderNumber);
          const up = await uploadProofScreenshot(fd);
          if (up.ok && up.url) proofImageUrl = up.url;
          else
            toast.error(t("proofUploadFailed"), {
              description: t("proofUploadFailedDesc"),
            });
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

  return (
    <div className="border-border rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display min-w-0 text-lg font-bold">
          {t("manualTitle")}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <ShieldCheck className="size-3.5" /> {t("manualBadge")}
        </span>
      </div>

      {/* Invoice ID — the anchor the client checks against whatever we send. */}
      <div className="border-primary/30 bg-primary/5 mt-4 rounded-xl border p-4 text-center">
        <p className="text-muted-foreground text-[11px] font-bold tracking-[0.14em] uppercase">
          {t("invoiceIdLabel")}
        </p>
        <p className="text-accent font-display mt-1 text-2xl font-extrabold tracking-[0.08em] break-all sm:text-3xl">
          {invoiceId}
        </p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-xs leading-relaxed">
          {t("invoiceIdNote")}
        </p>
      </div>

      <dl className="mt-4 space-y-2.5 text-sm">
        <Row k={t("amountDueNow")}>
          <span className="text-primary font-display text-xl font-bold">
            {amountLabel}
          </span>
        </Row>
        {balanceLabel ? (
          <Row k={t("balanceBeforeSetup")}>{balanceLabel}</Row>
        ) : null}
        {methodLabel ? <Row k={t("method")}>{methodLabel}</Row> : null}
      </dl>

      {/* How the details arrive */}
      <p className="border-primary/20 bg-primary/5 mt-4 rounded-xl border p-3.5 text-sm leading-relaxed">
        {t("manualBody", { method: methodLabel || t("yourMethod"), email })}{" "}
        {phone ? t("manualReachPhone", { phone }) : t("manualReach")}
      </p>

      {/* Verify by Invoice ID — the trust anchor (replaces on-site-only copy). */}
      <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-semibold">{t("manualVerifyTitle")}</p>
        <p className="mt-1 leading-relaxed">{t("manualVerifyBody")}</p>
      </div>

      {/* Proof — the client can confirm once they've paid. */}
      {proofSubmitted ? (
        <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
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
                onClick={() => {
                  setProofFile(null);
                  setPreviewUrl(null);
                }}
                aria-label={t("proofRemoveImage")}
                className="text-muted-foreground hover:text-foreground shrink-0 p-1"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
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
