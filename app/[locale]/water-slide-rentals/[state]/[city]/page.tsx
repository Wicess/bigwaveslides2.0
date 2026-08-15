import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  Sparkles,
  Truck,
  MapPin,
  PartyPopper,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getAllCities,
  getCity,
  citySlug,
  isPriorityCity,
} from "@/lib/locations";
import { getCityContent } from "@/lib/city-content";
import { getCityLocal } from "@/lib/city-local";
import { getLocalized } from "@/lib/localized";
import { getLandingRentals } from "@/server/data/rentals";
import { getGuideLinksOnce } from "@/server/data/blog";
import { getSettingsOnce } from "@/server/data/settings";
import { pickN } from "@/lib/internal-links";
import { buildMetadata } from "@/lib/seo";
import {
  localBusinessAreaLd,
  breadcrumbLd,
  faqLd,
  rentalItemListLd,
  absoluteUrl,
} from "@/lib/structured-data";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { PhotoHero } from "@/components/ui/photo-hero";
import { ProductCard } from "@/components/shop/product-card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";

// ISR: serve the cached page (stale-while-revalidate) so it stays up even
// when the serverless DB is asleep, and refreshes catalog data within the hour.
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; state: string; city: string }>;
};

// Occasions woven into the copy + keywords (event-based long-tail).
const OCCASIONS = [
  "backyard parties",
  "birthday parties",
  "church events",
  "school events",
  "corporate events",
  "community events",
  "family reunions",
  "summer camps",
];

export function generateStaticParams() {
  return getAllCities().map((c) => ({ state: c.state.slug, city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state, city } = await params;
  const loc = getCity(state, city);
  if (!loc) return {};
  const { name, state: st } = loc;
  // Only wave-1 priority metros are indexable; the rest stay crawlable and
  // linked (so they still pass equity and still serve a visitor who lands on
  // one) but out of the index, so crawl budget goes to the pages that can rank.
  const noindex = !isPriorityCity(st.slug, loc.slug);
  return buildMetadata({
    locale,
    noindex,
    path: `/water-slide-rentals/${st.slug}/${loc.slug}`,
    // Kept inside Google's ~60-character render width so the city — the whole
    // reason this page exists — never gets truncated away. The old title ran to
    // 83 characters, which meant "…from $199/Day — Delivered & Insured" was cut
    // and Google was free to rewrite the title with its own guess.
    title: `Water Slide Rentals in ${name}, ${st.abbr} — From $199/Day`,
    description: `Water slide & bounce house rentals in ${name}, ${st.abbr} from $199/day — delivered, set up, sanitized & insured. Free quote in minutes.`,
    og: {
      eyebrow: `${name}, ${st.abbr}`,
      subtitle: "Delivered, set up, sanitized & fully insured",
      badge: "Free quote",
      price: "From $199/day",
    },
    keywords: [
      `water slide rentals in ${name} ${st.abbr}`,
      `water slide rental ${name}`,
      `inflatable water slide rental ${name}`,
      `water slides for rent ${name} ${st.abbr}`,
      `water slide rentals ${name} ${st.name}`,
      `bounce house and water slide rentals ${name}`,
      `backyard water slide rental ${name}`,
      `birthday party water slide rental ${name}`,
      `church water slide rental ${name}`,
      `party rentals ${name} ${st.abbr}`,
      `water slide rentals near me`,
      `inflatable rentals ${name}`,
    ],
  });
}

export default async function CityRentalPage({ params }: Props) {
  const { locale, state, city } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loc = getCity(state, city);
  if (!loc) notFound();
  const { name, state: st } = loc;

  const [items, allGuides] = await Promise.all([
    getLandingRentals(),
    getGuideLinksOnce(),
  ]);

  const path = `/water-slide-rentals/${st.slug}/${loc.slug}`;
  const canonical = absoluteUrl(locale, path);
  const place = `${name}, ${st.abbr}`;

  // Sibling cities in the same state for internal linking.
  const siblings = st.cities.filter((c) => citySlug(c) !== loc.slug);

  // Deterministically-varied per-city content (hero image, opening copy,
  // a region/season paragraph, and the FAQ set) — differentiates the 750+
  // programmatic pages so they don't read as one identical template.
  const { hero, heroDescription, intro, seasonal, faqs, venues, setup } =
    getCityContent(loc);

  // Real, verifiable delivery suburbs/neighborhoods for this metro (priority
  // cities only) — the strongest "genuinely about this city" signal.
  const local = getCityLocal(st.slug, loc.slug);

  // Three featured slides woven into the write-up, picked deterministically
  // per city so the 750+ pages don't all name the same products.
  const seed = [...`${st.slug}/${loc.slug}`].reduce(
    (a, c) => (a * 31 + c.charCodeAt(0)) >>> 0,
    7,
  );
  const picks =
    items.length >= 3
      ? [0, 1, 2].map((i) => items[(seed + i * 3) % items.length]!)
      : [];

  // A rotating handful of blog guides — different per city — so this ranking
  // location page passes equity across the whole blog (and back to itself).
  const guides = pickN(allGuides, seed, 4);

  const trust = [
    { icon: ShieldCheck, label: "Fully insured" },
    { icon: Sparkles, label: "Sanitized before delivery" },
    { icon: Truck, label: "Delivery & setup included" },
  ];

  // Contact comes from Settings → Contact so schema only advertises a phone
  // once one is actually configured (and shown) on the site.
  const settings = await getSettingsOnce();

  return (
    <main>
      <JsonLd
        data={localBusinessAreaLd(
          st.name,
          canonical,
          { city: name, region: st.abbr },
          settings?.contact,
          "Water Slide Rentals",
          place,
        )}
      />
      <JsonLd
        data={breadcrumbLd([
          {
            name: "Water Slide Rentals",
            url: absoluteUrl(locale, "/water-slide-rentals"),
          },
          {
            name: st.name,
            url: absoluteUrl(locale, `/water-slide-rentals/${st.slug}`),
          },
          { name, url: canonical },
        ])}
      />
      <JsonLd data={faqLd(faqs)} />
      {items.length > 0 ? (
        <JsonLd data={rentalItemListLd(locale, items)} />
      ) : null}

      <PhotoHero
        image={hero}
        title={`Water Slide Rentals in ${name}, ${st.abbr}`}
        description={heroDescription}
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Breadcrumbs
            className="mb-8"
            items={[
              { label: "Home", href: "/" },
              { label: "Water slide rentals", href: "/water-slide-rentals" },
              { label: st.name, href: `/water-slide-rentals/${st.slug}` },
              { label: name },
            ]}
          />
          {/* Two-column spread on large screens: the written copy on the
              left, the local-area + occasion chips on the right — so the
              write-up uses the full width instead of pooling in the center. */}
          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {intro}
                </p>
              </Reveal>

              {/* Season window + local booking pressure. Written per city, not
                  per region — two cities in the same state have different
                  seasons and different weekends that sell out. */}
              {seasonal ? (
                <Reveal className="mt-4" delay={0.05}>
                  <p className="text-muted-foreground leading-relaxed">
                    {seasonal}
                  </p>
                </Reveal>
              ) : null}

              {/* Ground, access and anchoring — the part that is genuinely
                  different city to city (caliche in Phoenix, limestone in
                  Miami, gumbo clay in Houston) and the reason these pages are
                  worth indexing at all. */}
              {setup ? (
                <Reveal className="mt-4" delay={0.08}>
                  <h2 className="font-display text-foreground text-lg font-semibold">
                    Setting up in {name}
                  </h2>
                  <p className="text-muted-foreground mt-2 leading-relaxed">
                    {setup}
                  </p>
                </Reveal>
              ) : null}

              {/* Real venues locals actually book. */}
              {venues.length > 0 ? (
                <Reveal className="mt-6" delay={0.1}>
                  <h2 className="font-display text-foreground text-lg font-semibold">
                    Venues we deliver to around {name}
                  </h2>
                  <ul className="text-muted-foreground mt-2 grid gap-1.5 sm:grid-cols-2">
                    {venues.map((v) => (
                      <li key={v} className="flex gap-2">
                        <span aria-hidden="true" className="text-primary">
                          ·
                        </span>
                        {v}
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    Public sites run their own reservation process — confirm
                    your spot before booking the slide, and ask us for a
                    certificate of insurance early if the venue needs one.
                  </p>
                </Reveal>
              ) : null}

              {/* Real local delivery area — unique, verifiable per-metro content. */}
              {local ? (
                <Reveal className="mt-4" delay={0.05}>
                  <p className="text-muted-foreground leading-relaxed">
                    We cover the greater {name} area — including{" "}
                    {local.areas.slice(0, -1).join(", ")}, and{" "}
                    {local.areas[local.areas.length - 1]} — with the same
                    delivery, professional setup, sanitizing, and full insurance
                    on every booking, wherever your {name} event takes place.
                  </p>
                </Reveal>
              ) : null}

              {/* Three concrete slides from the fleet, linked inline. */}
              {picks.length === 3 ? (
                <Reveal className="mt-4" delay={0.05}>
                  <p className="text-muted-foreground leading-relaxed">
                    Not sure where to start? Three of the most-booked slides for{" "}
                    {name} events right now are the{" "}
                    <Link
                      href={`/rent/${picks[0]!.slug}`}
                      className="text-primary font-medium underline underline-offset-4 hover:no-underline"
                    >
                      {getLocalized(picks[0]!.name, locale)}
                    </Link>
                    , the{" "}
                    <Link
                      href={`/rent/${picks[1]!.slug}`}
                      className="text-primary font-medium underline underline-offset-4 hover:no-underline"
                    >
                      {getLocalized(picks[1]!.name, locale)}
                    </Link>
                    , and the{" "}
                    <Link
                      href={`/rent/${picks[2]!.slug}`}
                      className="text-primary font-medium underline underline-offset-4 hover:no-underline"
                    >
                      {getLocalized(picks[2]!.name, locale)}
                    </Link>
                    . Each product page lists sizing, space requirements, and
                    the daily rate, so you can match a slide to your {name}{" "}
                    backyard or venue before you request a quote.
                  </p>
                </Reveal>
              ) : null}
            </div>

            <div className="lg:col-span-5">
              {/* Neighborhoods & nearby areas we serve (local trust signal). */}
              {local ? (
                <Reveal delay={0.05}>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Neighborhoods & nearby areas we serve
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {local.areas.map((a) => (
                      <span
                        key={a}
                        className="border-border bg-background inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
                      >
                        <MapPin className="text-primary size-3.5" />
                        {a}
                      </span>
                    ))}
                  </div>
                </Reveal>
              ) : null}

              {/* Occasions */}
              <Reveal className={local ? "mt-8" : ""} delay={0.05}>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Water slides in {name} for every occasion
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {OCCASIONS.map((o) => (
                    <span
                      key={o}
                      className="border-border bg-background inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm capitalize"
                    >
                      <PartyPopper className="text-primary size-3.5" />
                      {o}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>

          {/* Trust */}
          <ul className="border-border mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y py-4 text-sm">
            {trust.map((it) => {
              const Icon = it.icon;
              return (
                <li key={it.label} className="flex items-center gap-2">
                  <Icon className="text-primary size-4" />
                  {it.label}
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* Catalog */}
      {items.length > 0 ? (
        <Section
          spacing="compact"
          className="border-border bg-muted/40 border-t"
        >
          <Container className="max-w-[84rem]">
            <SectionHeader title={`Popular water slides for ${name} events`} />
            <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-8 min-[440px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 4) * 0.05} scale>
                  <ProductCard
                    product={p}
                    locale={locale}
                    context="rent"
                    priority={i < 2}
                  />
                </Reveal>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button asChild size="lg" variant="gradient">
                <Link href="/rent">Browse all water slides</Link>
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* FAQ — full-width on large screens, questions split across two
          columns so the section spreads instead of centering in a strip. */}
      <Section spacing="compact" className="border-border border-t">
        <Container className="max-w-[84rem]">
          <SectionHeader title={`Water slide rentals in ${name} — FAQ`} />
          <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
            {[
              faqs.slice(0, Math.ceil(faqs.length / 2)),
              faqs.slice(Math.ceil(faqs.length / 2)),
            ].map((col, ci) =>
              col.length > 0 ? (
                <Accordion
                  key={ci}
                  type="multiple"
                  defaultValue={ci === 0 ? ["q0"] : []}
                  className="border-border rounded-[var(--radius-lg)] border"
                >
                  {col.map((f, i) => (
                    <AccordionItem
                      key={i}
                      value={`q${i}`}
                      className="px-4 last:border-b-0"
                    >
                      <AccordionTrigger>{f.q}</AccordionTrigger>
                      <AccordionContent>
                        <p className="leading-relaxed">{f.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : null,
            )}
          </div>
        </Container>
      </Section>

      {/* Planning guides — links the ranking city page into the blog so equity
          flows across the whole site. */}
      {guides.length > 0 ? (
        <Section spacing="compact" className="border-border border-t">
          <Container className="max-w-[84rem]">
            <SectionHeader title={`Water slide rental guides & tips`} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {guides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/blog/${g.slug}`}
                  className="border-border hover:border-primary group flex items-start justify-between gap-3 rounded-2xl border p-5 transition-colors"
                >
                  <span className="text-sm leading-snug font-semibold">
                    {getLocalized(g.title, locale)}
                  </span>
                  <PartyPopper className="text-primary/70 size-4 shrink-0" />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* CTA + sibling cities */}
      <Section
        spacing="compact"
        className="border-border bg-muted/40 border-t pb-16"
      >
        <Container className="max-w-[84rem]">
          <div className="overflow-hidden rounded-3xl px-6 py-12 text-center text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_100%)]">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Make a splash in {name}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/75">
              Tell us your date and venue in {name} — we'll send a free,
              no-obligation quote with delivery, setup, and insurance included.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link href="/contact">Request a free quote</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={`/bounce-house-rentals/${st.slug}/${loc.slug}`}>
                  Bounce houses in {name}
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2">
            <Link
              href={`/water-slide-rentals/${st.slug}`}
              className="border-primary bg-primary/5 text-primary hover:bg-primary inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors hover:text-white"
            >
              <MapPin className="size-3.5" /> All of {st.name}
            </Link>
            {siblings.map((c) => (
              <Link
                key={c}
                href={`/water-slide-rentals/${st.slug}/${citySlug(c)}`}
                className="border-border bg-background hover:border-primary hover:text-primary rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
