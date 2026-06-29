// subscribe-popup.tsx
// A side popup that invites the visitor to subscribe for 15% off. It slides in
// from the bottom-right every 10 seconds until the visitor subscribes; once
// subscribed it never shows again (remembered in localStorage). Subscribing
// registers the email with the newsletter (admin → Newsletter) and records a
// NEWSLETTER_SUBSCRIBE analytics event so it appears in the visitor's activity.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Mail, CheckCircle2, Sparkles } from "lucide-react";
import { subscribeNewsletter } from "@/server/actions/newsletter";
import { trackEvent } from "@/lib/analytics/client";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bws_news_sub"; // "1" once subscribed
const INTERVAL_MS = 10_000;

export function SubscribePopup({ locale = "en" }: { locale?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Already subscribed → never show.
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    // Show after the first 10s, then keep re-appearing every 10s while closed.
    const tick = () => {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      setOpen((prev) => prev || true);
    };
    const first = window.setTimeout(tick, INTERVAL_MS);
    const interval = window.setInterval(() => {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      setOpen(true);
    }, INTERVAL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    const res = await subscribeNewsletter({ email, locale, source: "popup" });
    setLoading(false);
    if (res.ok) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore storage errors
      }
      trackEvent({ type: "NEWSLETTER_SUBSCRIBE", meta: { source: "popup", email } });
      setDone(true);
      toast.success("You're in! Your 15% discount is on its way.");
      window.setTimeout(() => setOpen(false), 2600);
    } else {
      toast.error(res.error ?? "Subscription failed. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Subscribe for 15% off"
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_60px_-20px_rgba(2,32,71,0.45)]",
        "animate-[wa-pop_0.35s_ease-out]",
      )}
    >
      {/* Gradient header with logo + close */}
      <div className="relative flex items-center gap-2.5 px-5 pb-4 pt-5 text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_55%,#0099FF_140%)]">
        <span className="grid size-10 place-items-center rounded-xl bg-white/95 p-1.5">
          <Image src="/logo.png" alt="Big Wave Slides" width={80} height={68} className="h-7 w-auto" />
        </span>
        <span className="font-display text-base font-bold leading-tight">Big Wave Slides</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="size-4.5" />
        </button>
      </div>

      <div className="p-5">
        {done ? (
          <div className="flex items-center gap-3 py-2">
            <CheckCircle2 className="size-8 shrink-0 text-emerald-500" />
            <p className="text-sm font-medium text-foreground">
              You&apos;re subscribed! Watch your inbox for your <strong>15% off</strong> code.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Limited offer</span>
            </div>
            <h2 className="mt-1.5 font-display text-xl font-extrabold leading-tight text-foreground">
              Get <span className="text-primary">15% OFF</span> your first rental
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Join our list for exclusive deals, new slides, and party tips. Your discount lands straight in your inbox.
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 focus-within:border-primary">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 [background:linear-gradient(135deg,#0099FF,#00D4FF)]"
              >
                {loading ? "Subscribing…" : "Claim my 15% off"}
              </button>
            </form>
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
              No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
