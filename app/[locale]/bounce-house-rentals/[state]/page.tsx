import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { US_STATES, getStateBySlug, citySlug } from "@/lib/locations";
import { getBounceContent, bounceKeywords } from "@/lib/bounce-houses";
import { getLandingBounceHouses } from "@/server/data/rentals";
import { getGuideLinksOnce } from "@/server/data/blog";
import { getSettingsOnce } from "@/server/data/settings";
import { pickN, hashSeed } from "@/lib/internal-links";
import { buildMetadata } from "@/lib/seo";
import {
  localBusinessAreaLd,
  breadcrumbLd,
  faqLd,
  rentalItemListLd,
  absoluteUrl,
} from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { BounceLocationPage } from "@/components/sections/bounce/bounce-location-page";

// ISR: serve the cached page even when the serverless DB is asleep, and refresh
// the catalog within the hour.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; state: string }> };

export function generateStaticParams() {
  return US_STATES.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state } = await params;
  const loc = getStateBySlug(state);
  if (!loc) return {};
  const cities3 = loc.cities.slice(0, 3).join(", ");
  return buildMetadata({
    locale,
    path: `/bounce-house-rentals/${loc.slug}`,
    title: `Bounce House Rentals in ${loc.name} — From $165/Day`,
    description: `Bounce house & combo rentals across ${loc.name} from $165/day — delivered, set up, sanitized & insured in ${cities3} and statewide. Free quote.`,
    og: {
      eyebrow: loc.name,
      subtitle: "Bounce houses & combos — indoor or out, all year round",
      badge: "Free quote",
      price: "From $165/day",
    },
    keywords: [
      ...bounceKeywords(loc.name, loc.abbr),
      ...loc.cities.slice(0, 12).map((c) => `bounce house rental ${c}`),
    ],
  });
}

export default async function StateBouncePage({ params }: Props) {
  const { locale, state } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loc = getStateBySlug(state);
  if (!loc) notFound();

  const [items, allGuides, settings] = await Promise.all([
    getLandingBounceHouses(),
    getGuideLinksOnce(),
    getSettingsOnce(),
  ]);

  const path = `/bounce-house-rentals/${loc.slug}`;
  const canonical = absoluteUrl(locale, path);
  const content = getBounceContent(loc.slug, loc.name, loc.region, loc.region);
  const guides = pickN(allGuides, hashSeed(`bounce-${loc.slug}`), 4);

  return (
    <main>
      <JsonLd
        data={localBusinessAreaLd(
          loc.name,
          canonical,
          { city: loc.cities[0]!, region: loc.abbr },
          settings?.contact,
          "Bounce House Rentals",
        )}
      />
      <JsonLd
        data={breadcrumbLd([
          {
            name: "Bounce House Rentals",
            url: absoluteUrl(locale, "/bounce-house-rentals"),
          },
          { name: loc.name, url: canonical },
        ])}
      />
      <JsonLd data={faqLd(content.faqs)} />
      {items.length > 0 ? (
        <JsonLd data={rentalItemListLd(locale, items)} />
      ) : null}

      <BounceLocationPage
        locale={locale}
        place={loc.name}
        headline={`Bounce House Rentals in ${loc.name}`}
        content={content}
        items={items}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Bounce house rentals", href: "/bounce-house-rentals" },
          { label: loc.name },
        ]}
        chipsTitle={`Cities we serve in ${loc.name}`}
        chips={loc.cities.map((c) => ({
          href: `/bounce-house-rentals/${loc.slug}/${citySlug(c)}`,
          label: c,
        }))}
        waterSlideHref={`/water-slide-rentals/${loc.slug}`}
        waterSlideLabel={`water slide rentals in ${loc.name}`}
        guides={guides}
        ctaTitle={`Book a bounce house in ${loc.name}`}
      />
    </main>
  );
}
