import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getStateProfile } from "@/lib/state-profiles";
import { routing } from "@/i18n/routing";
import { BOUNCE_STATE_KEYS, citySlug, getStateBySlug } from "@/lib/locations";
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

// See the note on the blog pages: widened because revalidateTag("products")
// makes catalog edits appear immediately, so this window is only a backstop.
export const revalidate = 21600;

type Props = { params: Promise<{ locale: string; state: string }> };

export function generateStaticParams() {
  // Only the states that keep a bounce-house hub — see BOUNCE_STATE_KEYS.
  // Everything else is redirected to the national hub in middleware and never
  // reaches this route.
  return BOUNCE_STATE_KEYS.map((state) => ({ state }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state } = await params;
  const loc = getStateBySlug(state);
  if (!loc) return {};
  return buildMetadata({
    locale,
    path: `/bounce-house-rentals/${loc.slug}`,
    title: `Bounce House Rentals in ${loc.name} — From $165/Day`,
    // Two cities, not three. The water-slide side was shortened for the same
    // reason: three city names pushed all 51 of these past what Google renders.
    description: `Bounce house & combo rentals across ${loc.name} from $165/day — delivered, set up, sanitized and insured in ${loc.cities.slice(0, 2).join(" and ")}.`,
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

  // "Cities we serve" now links to the WATER-SLIDE page for each town. The
  // bounce-house city pages are gone (see BOUNCE_STATE_KEYS), and pointing at
  // a real page about that town beats pointing at a redirect. The bounce-house
  // offer for those cities is this page.
  const canonical = absoluteUrl(locale, path);
  const content = getBounceContent(
    loc.slug,
    loc.name,
    loc.region,
    loc.region,
    getStateProfile(loc.slug),
  );
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
          href: `/water-slide-rentals/${loc.slug}/${citySlug(c)}`,
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
