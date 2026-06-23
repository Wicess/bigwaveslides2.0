"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { subscribeNewsletter } from "@/server/actions/newsletter";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export function NewsletterForm({ className }: { className?: string }) {
  const t = useTranslations("Layout");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const res = await subscribeNewsletter({ email, locale });
    setLoading(false);
    if (res.ok) {
      toast.success(t("subscribeSuccess"));
      setEmail("");
    } else {
      toast.error(res.error ?? t("subscribeError"));
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex w-full max-w-md gap-2", className)}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("newsletterPlaceholder")}
        className="h-11 w-full rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 focus-visible:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      />
      <button
        type="submit"
        disabled={loading}
        aria-label={t("subscribe")}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-accent transition-transform hover:scale-105 disabled:opacity-60"
      >
        <ArrowRight className="size-5" />
      </button>
    </form>
  );
}
