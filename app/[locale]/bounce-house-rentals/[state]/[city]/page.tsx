import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  getAllCities,
  getCity,
  citySlug,
  isPriorityCity,
} from "@/lib/locations";
import { getCityLocal } from "@/lib/city-local";
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

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; state: string; city: string }>;
};

export function generateStaticParams() {
  return getAllCities().map((c) => ({ state: c.state.slug, city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state, city } = await params;
  const loc = getCity(state, city);
  if (!loc) return {};
  const { name, state: st } = loc;
  // Same indexing discipline as the water-slide city pages: only the wave-1
  // priority metros are indexable. Every other city page stays crawlable and
  // linked — so it still passes equity and still serves a real visitor — but
  // doesn't spend crawl budget competing for terms the domain can't win yet.
  const noindex = !isPriorityCity(st.slug, loc.slug);
  return buildMetadata({
    locale,
    enOnly: true,
    noindex,
    path: `/bounce-house-rentals/${st.slug}/${loc.slug}`,
    title: `Bounce House Rentals in ${name}, ${st.abbr} — From $159/Day`,
    description: `Bounce house & combo rentals in ${name}, ${st.abbr} from $159/day — delivered, set up, sanitized & insured. Indoor or outdoor. Free quote.`,
    og: {
      eyebrow: `${name}, ${st.abbr}`,
      subtitle: "Bounce houses & combos — indoor or out, all year round",
      badge: "Free quote",
      price: "From $159/day",
    },
    keywords: bounceKeywords(name, st.abbr),
  });
}

export default async function CityBouncePage({ params }: Props) {
  const { locale, state, city } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loc = getCity(state, city);
  if (!loc) notFound();
  const { name, state: st } = loc;

  const [items, allGuides, settings] = await Promise.all([
    getLandingBounceHouses(),
    getGuideLinksOnce(),
    getSettingsOnce(),
  ]);

  const key = `${st.slug}/${loc.slug}`;
  const path = `/bounce-house-rentals/${key}`;
  const canonical = absoluteUrl(locale, path);
  const content = getBounceContent(key, name, st.name, st.region);
  const guides = pickN(allGuides, hashSeed(`bounce-${key}`), 4);

  // Real neighbouring suburbs for the priority metros — the strongest "this
  // page is genuinely about this city" signal we have. Falls back to the
  // other cities in the state.
  const local = getCityLocal(st.slug, loc.slug);
  const chips = local?.areas.length
    ? local.areas.map((a) => ({ href: path, label: a }))
    : st.cities
        .filter((c) => c !== name)
        .slice(0, 10)
        .map((c) => ({
          href: `/bounce-house-rentals/${st.slug}/${citySlug(c)}`,
          label: c,
        }));

  return (
    <main>
      <JsonLd
        data={localBusinessAreaLd(
          st.name,
          canonical,
          { city: name, region: st.abbr },
          settings?.contact,
          "Bounce House Rentals",
          `${name}, ${st.abbr}`,
        )}
      />
      <JsonLd
        data={breadcrumbLd([
          {
            name: "Bounce House Rentals",
            url: absoluteUrl(locale, "/bounce-house-rentals"),
          },
          {
            name: st.name,
            url: absoluteUrl(locale, `/bounce-house-rentals/${st.slug}`),
          },
          { name, url: canonical },
        ])}
      />
      <JsonLd data={faqLd(content.faqs)} />
      {items.length > 0 ? (
        <JsonLd data={rentalItemListLd(locale, items)} />
      ) : null}

      <BounceLocationPage
        locale={locale}
        place={name}
        headline={`Bounce House Rentals in ${name}, ${st.abbr}`}
        content={content}
        items={items}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Bounce house rentals", href: "/bounce-house-rentals" },
          { label: st.name, href: `/bounce-house-rentals/${st.slug}` },
          { label: name },
        ]}
        chipsTitle={
          local?.areas.length
            ? `We deliver across ${name}`
            : `Other cities in ${st.name}`
        }
        chips={chips}
        waterSlideHref={`/water-slide-rentals/${st.slug}/${loc.slug}`}
        waterSlideLabel={`water slide rentals in ${name}`}
        guides={guides}
        ctaTitle={`Book a bounce house in ${name}`}
      />
    </main>
  );
}
