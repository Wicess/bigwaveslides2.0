import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Phase 2 scaffolding splash — proves design tokens, fonts, and EN/FR routing.
 * Replaced by the real cinematic homepage in Phase 7.
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tSetup = await getTranslations("Setup");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-20">
      {/* Ambient brand wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(0,212,255,0.18), transparent 70%), radial-gradient(50% 50% at 80% 90%, rgba(0,153,255,0.16), transparent 70%)",
        }}
      />

      <div className="glass mx-auto w-full max-w-2xl rounded-[var(--radius-xl)] p-10 shadow-[var(--shadow-soft)] sm:p-14">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {tSetup("badge")}
          </span>
          <LocaleSwitcher />
        </div>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {t("eyebrow")}
        </p>

        <h1 className="mt-3 text-5xl font-bold leading-[1.05] sm:text-6xl">
          <span className="text-gradient">{t("tagline")}</span>
        </h1>

        <p className="mt-5 max-w-prose text-lg text-muted-foreground">
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-glow)]">
            {t("ctaShop")}
          </span>
          <span className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground">
            {t("ctaRent")}
          </span>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          {tSetup("note")}
        </p>
      </div>
    </main>
  );
}
