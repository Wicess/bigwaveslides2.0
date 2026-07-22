"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageCircleQuestion,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { acceptQuote } from "@/server/actions/order-flow";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

/** The decision bar under the quote: accept it (→ invoice issued instantly)
    or talk to us first. */
export function QuoteActions({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations("OrderFlow");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [agreed, setAgreed] = useState(false);

  const accept = () =>
    startTransition(async () => {
      const res = await acceptQuote({ orderNumber });
      if (res.ok) {
        toast.success(t("quoteAcceptedToast"));
        router.refresh();
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    });

  return (
    <div className="border-border bg-muted/40 rounded-2xl border p-5 sm:p-6">
      {/* Whole row is the tap target — 44px+ and impossible to miss. */}
      <label className="border-border bg-background hover:border-primary/50 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="accent-primary mt-0.5 size-5 shrink-0"
        />
        <span className="text-sm leading-relaxed">{t("agreeTerms")}</span>
      </label>
      {/* Accept is the hero — full-width, taller, with a leading check and a
          trailing arrow. The question is a slim, quiet secondary beneath it. */}
      <Button
        size="lg"
        variant="gradient"
        disabled={!agreed || pending}
        onClick={accept}
        className="group mt-4 h-14 w-full text-base font-bold"
      >
        {pending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <CheckCircle2 className="size-5" />
        )}
        {pending ? t("accepting") : t("acceptCta")}
        {!pending ? (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        ) : null}
      </Button>
      <p className="text-muted-foreground mt-2.5 text-center text-xs leading-relaxed">
        {agreed ? t("acceptHint") : t("agreeFirstHint")}
      </p>
      <Link
        href="/contact"
        className="text-muted-foreground hover:text-primary mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium transition-colors"
      >
        <MessageCircleQuestion className="size-4" />
        {t("contactCta")}
      </Link>
    </div>
  );
}
