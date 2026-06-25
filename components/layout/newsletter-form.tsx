// newsletter-form.tsx
// The email sign-up box in the site footer. The visitor types their email and
// presses the arrow button; we send it to a server action (subscribeNewsletter)
// which records the subscription. We show a loading state while waiting, a
// toast (small popup) for success/error, and a confirmation message afterward.

"use client";

import { useState } from "react";
// next-intl handles translations (t) and knows the current language (locale).
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2 } from "lucide-react";
// A "server action" — a function that runs on the server but is called like a
// normal async function from the browser.
import { subscribeNewsletter } from "@/server/actions/newsletter";
import { toast } from "@/components/ui/toaster";
// cn merges Tailwind class names together safely.
import { cn } from "@/lib/utils";

export function NewsletterForm({ className }: { className?: string }) {
  const t = useTranslations("Layout"); // t("key") -> translated text
  const locale = useLocale(); // e.g. "en", "es" — sent along so emails match

  // Component state (values that change and re-render the UI):
  const [email, setEmail] = useState(""); // what's typed in the input
  const [loading, setLoading] = useState(false); // true while submitting
  const [done, setDone] = useState(false); // true after a successful subscribe

  // Runs when the form is submitted.
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); // stop the browser's default page reload
    if (!email) return; // do nothing if the field is empty
    setLoading(true); // disable the button / show loading
    // Call the server action and wait for its result.
    const res = await subscribeNewsletter({ email, locale });
    setLoading(false);
    if (res.ok) {
      // Success: show a popup, clear the field, and swap to the "done" message.
      toast.success(t("subscribeSuccess"));
      setEmail("");
      setDone(true);
    } else {
      // Failure: show the server's error, or a generic translated fallback.
      toast.error(res.error ?? t("subscribeError"));
    }
  }

  // After a successful subscribe, replace the form with a confirmation line.
  if (done) {
    return (
      <p
        className={cn(
          "flex w-full max-w-md items-center gap-2 text-sm font-medium text-white",
          className,
        )}
      >
        <CheckCircle2 className="size-5 shrink-0" /> {t("subscribeSuccess")}
      </p>
    );
  }

  // The form itself: an email input plus a submit button.
  return (
    <form onSubmit={onSubmit} className={cn("flex w-full max-w-md gap-2", className)}>
      <input
        type="email"
        required
        value={email} // controlled input: React owns the value
        onChange={(e) => setEmail(e.target.value)} // keep state in sync as they type
        placeholder={t("newsletterPlaceholder")}
        className="h-11 w-full rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 focus-visible:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      />
      <button
        type="submit"
        disabled={loading} // prevent double submits while the request is in flight
        aria-label={t("subscribe")}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-accent transition-transform hover:scale-105 disabled:opacity-60"
      >
        <ArrowRight className="size-5" />
      </button>
    </form>
  );
}
