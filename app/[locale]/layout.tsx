/**
 * Per-locale root layout.
 *
 * In the App Router a `layout.tsx` wraps every page beneath it. Because this
 * one lives in `[locale]/`, it is the top-level shell for all language pages.
 * It renders the <html>/<body> tags, loads fonts and global CSS, exposes
 * site-wide metadata, and wraps the page (`children`) in shared providers and
 * chrome (announcement bar, header, footer, floating buttons, analytics).
 *
 * Unlike `page.tsx`, a layout does NOT re-render when navigating between pages
 * inside it — so the header/footer stay mounted as the user moves around.
 */
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getNavData, type NavData } from "@/server/data/navigation";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { Toaster } from "@/components/ui/toaster";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { BackToTop } from "@/components/layout/back-to-top";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { Analytics } from "@/components/analytics";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationLd, websiteLd } from "@/lib/structured-data";
// Self-hosted variable fonts (offline, no layout shift). Family names:
// "Inter Variable" (body) and "Sora Variable" (display) — wired in globals.css.
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "@fontsource-variable/space-grotesk";
import "../globals.css";

// Default SEO/social metadata for every page. Individual pages can override
// pieces of this; the `title.template` wraps page titles as "<page> · Big Wave Slides".
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
  openGraph: {
    type: "website",
    siteName: "Big Wave Slides",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og"],
  },
  // Search-engine ownership verification (Google Search Console + Bing).
  verification: {
    google: "EiaEaBxPwPlkg1Q-kchHGk0G47tnHzV55VN85wQAf1I",
    other: { "msvalidate.01": "A8C9495020F192A25CD68B7F02D73D38" },
  },
};

export const viewport: Viewport = {
  // Edge-to-edge: let the app paint under the status bar / notch on mobile so
  // it feels like a native app. Safe-area insets keep content clear of it.
  viewportFit: "cover",
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

// Tells Next.js, at build time, which `locale` values exist so it can
// pre-render a static page per language (e.g. /en, /es) ahead of any request.
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
  // Read the language code from the URL and reject unsupported ones (404).
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Set the active language for this request (needed before reading messages
  // or translations on the server, and to keep the page statically renderable).
  setRequestLocale(locale);
  // All translation strings for this language, handed to the client provider below.
  const messages = await getMessages();
  // Navigation/footer content (menus, settings). Falls back to empty structures
  // if the fetch fails so the header and footer still render.
  const navData: NavData = await getNavData().catch(() => ({
    categories: [],
    rentals: [],
    services: [],
    settings: {},
  }));
  // `t` / `tc` are translator functions scoped to a namespace in the messages.
  const t = await getTranslations("Layout");
  const tc = await getTranslations("Common");
  const year = new Date().getFullYear();

  return (
    // `lang` is set per locale so screen readers and search engines know the language.
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        {/* "Skip to content" link: hidden until focused via keyboard (accessibility). */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-[var(--shadow-glow)]"
        >
          {tc("skipToContent")}
        </a>
        {/* Makes translations available to Client Components below via React context. */}
        <NextIntlClientProvider messages={messages}>
          <ScrollProgress />
          {/* LenisProvider enables smooth scrolling for everything inside it. */}
          <LenisProvider>
            <AnnouncementBar />
            <SiteHeader locale={locale} data={navData} />
            {/* `children` is the current page (e.g. the homepage from page.tsx). */}
            <div id="main-content">{children}</div>
            <SiteFooter locale={locale} data={navData} year={year} />
          </LenisProvider>
          <WhatsAppFab
            phone={navData.settings.contact?.whatsapp}
            label={t("whatsapp")}
          />
          <BackToTop label={t("backToTop")} />
          <Toaster />
          <AnalyticsTracker />
        </NextIntlClientProvider>
        <Analytics />
        {/* JSON-LD: structured data that helps search engines understand the site. */}
        <JsonLd data={organizationLd(navData.settings.contact)} />
        <JsonLd data={websiteLd()} />
      </body>
    </html>
  );
}
