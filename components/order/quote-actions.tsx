"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageCircleQuestion } from "lucide-react";
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
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          variant="gradient"
          disabled={!agreed || pending}
          onClick={accept}
          className="flex-1"
        >
          <CheckCircle2 className="size-4" />
          {pending ? t("accepting") : t("acceptCta")}
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link href="/contact">
            <MessageCircleQuestion className="size-4" />
            {t("contactCta")}
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
        {agreed ? t("acceptHint") : t("agreeFirstHint")}
      </p>
    </div>
  );
}
