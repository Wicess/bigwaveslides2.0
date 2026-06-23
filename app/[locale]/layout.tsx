import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getNavData, type NavData } from "@/server/data/navigation";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { BackToTop } from "@/components/layout/back-to-top";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { Analytics } from "@/components/analytics";
// Self-hosted variable fonts (offline, no layout shift). Family names:
// "Inter Variable" (body) and "Sora Variable" (display) — wired in globals.css.
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Big Wave Slides — Sell · Rent · Install Water Slides",
    template: "%s · Big Wave Slides",
  },
  description:
    "Premium water slides to buy, rent, and install for unforgettable parties, events, and gatherings.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const navData: NavData = await getNavData().catch(() => ({
    categories: [],
    rentals: [],
    services: [],
    settings: {},
  }));
  const t = await getTranslations("Layout");
  const year = new Date().getFullYear();

  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider messages={messages}>
          <ScrollProgress />
          <LenisProvider>
            <SiteHeader locale={locale} data={navData} />
            {children}
            <SiteFooter locale={locale} data={navData} year={year} />
          </LenisProvider>
          <WhatsAppFab
            phone={navData.settings.contact?.whatsapp}
            label={t("whatsapp")}
          />
          <BackToTop label={t("backToTop")} />
          <Toaster />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
