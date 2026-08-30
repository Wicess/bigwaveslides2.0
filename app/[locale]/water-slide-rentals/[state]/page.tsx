import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ShieldCheck, Sparkles, Truck, MapPin } from "lucide-react";
import { routing } from "@/i18n/routing";
import { getStateProfile } from "@/lib/state-profiles";
import { US_STATES, getStateBySlug, citySlug } from "@/lib/locations";
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

type Props = { params: Promise<{ locale: string; state: string }> };

const HERO =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/services/1782552093459-u6mqiy-event-rentals.jpg";

export function generateStaticParams() {
  return US_STATES.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state } = await params;
  const loc = getStateBySlug(state);
  if (!loc) return {};
  const cities3 = loc.cities.slice(0, 3).join(", ");
  const metaProfile = getStateProfile(loc.slug);
  return buildMetadata({
    locale,
    path: `/water-slide-rentals/${loc.slug}`,
    title: `Water Slide Rentals in ${loc.name} — From $155/Day`,
    // The season window is the one fact that genuinely differs state to state,
    // so it leads. Before this every state's description was the same sentence
    // with the name and a city list swapped, which is what Bing §13 flags as a
    // duplicate-description problem.
    description: metaProfile
      ? `Water slide rentals across ${loc.name} from $155/day. Season runs ${metaProfile.season.toLowerCase()} — delivered, set up and insured in ${cities3} and statewide.`
      : `Water slide & bounce house rentals across ${loc.name} from $155/day — delivered, set up & insured in ${cities3} and statewide. Free quote.`,
    og: {
      eyebrow: loc.name,
      subtitle: "Delivered, set up & fully insured statewide",
      badge: "Free quote",
      price: "From $155/day",
    },
    keywords: [
      `water slide rentals ${loc.name}`,
      `inflatable water slide rental ${loc.name}`,
      `water slide rental near me`,
      `bounce house water slide rental ${loc.name}`,
      `backyard water slide rental ${loc.name}`,
      `party water slide rental ${loc.name}`,
      ...loc.cities.map((c) => `water slide rental ${c}`),
    ],
  });
}

export default async function StateRentalPage({ params }: Props) {
  const { locale, state } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loc = getStateBySlug(state);
  if (!loc) notFound();

  const [items, allGuides] = await Promise.all([
    getLandingRentals(),
    getGuideLinksOnce(),
  ]);

  const cityList = loc.cities.join(", ");
  const path = `/water-slide-rentals/${loc.slug}`;
  const canonical = absoluteUrl(locale, path);

  // Strategic anchor = the state's largest-demand metro (the location's
  // strategic position within the state). Cities are population-ordered.
  const anchor = loc.cities[0]!;
  const anchorNearby = loc.cities.slice(1, 4).join(", ");

  // A few nearby states (same region) for internal linking.
  // Hand-written, genuinely per-state facts. Without this the 51 hubs were
  // 96-97% identical to each other and Google declined to index them.
  const profile = getStateProfile(loc.slug);

  const nearby = US_STATES.filter(
    (s) => s.region === loc.region && s.slug !== loc.slug,
  ).slice(0, 6);

  // Three featured slides woven into the write-up, picked deterministically
  // per state so the 50 hubs don't all name the same products.
  const seed = [...loc.slug].reduce(
    (a, c) => (a * 31 + c.charCodeAt(0)) >>> 0,
    7,
  );
  const picks =
    items.length >= 3
      ? [0, 1, 2].map((i) => items[(seed + i * 3) % items.length]!)
      : [];

  // Rotating blog guides — different per state — so this hub links into the
  // blog and spreads ranking equity across the whole site.
  const guides = pickN(allGuides, seed, 4);

  const faqs = [
    ...(profile
      ? [
          {
            q: `When is water slide season in ${loc.name}?`,
            a: `${profile.season}. ${profile.climate}`,
          },
          {
            q: `What does the ground in ${loc.name} mean for setup?`,
            a: profile.ground,
          },
          {
            q: `How far ahead should I book in ${loc.name}?`,
            a: profile.demand,
          },
          {
            q: `Do I need a permit for an inflatable in ${loc.name}?`,
            a: `${profile.permits} A private yard rarely needs anything, and we can provide a certificate of insurance naming your venue if it asks for one — request it when you book rather than in the final week.`,
          },
        ]
      : []),
    {
      q: `Do you deliver water slides anywhere in ${loc.name}?`,
      a: `Yes — Splash Republic delivers, sets up, anchors and collects across ${loc.name}, including ${cityList}. Tell us your venue and date and we'll confirm delivery in your free quote.`,
    },
    {
      q: `How much does a water slide rental cost in ${loc.name}?`,
      a: `Daily rates run $155 to $570 depending on the unit, plus a flat $30 delivery fee per order — not per mile. A mid-range tall slide is $330 for the day, so $360 delivered, set up, anchored and collected. A refundable deposit is quoted separately.`,
    },
  ];

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
          loc.name,
          canonical,
          { city: anchor, region: loc.abbr },
          settings?.contact,
        )}
      />
      <JsonLd
        data={breadcrumbLd([
          {
            name: "Water Slide Rentals",
            url: absoluteUrl(locale, "/water-slide-rentals"),
          },
          { name: loc.name, url: canonical },
        ])}
      />
      <JsonLd data={faqLd(faqs)} />
      {items.length > 0 ? (
        <JsonLd data={rentalItemListLd(locale, items)} />
      ) : null}

      <PhotoHero
        image={HERO}
        title={`Water Slide Rentals in ${loc.name}`}
        description={`Commercial-grade inflatable water slides delivered, set up, and picked up across ${loc.name}. Perfect for birthdays, pool parties, schools, churches, and festivals.`}
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Breadcrumbs
            className="mb-8"
            items={[
              { label: "Home", href: "/" },
              { label: "Water slide rentals", href: "/water-slide-rentals" },
              { label: loc.name },
            ]}
          />
          {/* Two-column spread on large screens: the written copy on the
              left, the city links on the right — so the write-up uses the
              full width instead of pooling in the center. */}
          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Looking for a water slide rental in {loc.name}? Splash
                  Republic Slides brings the waterpark to you — anywhere in the{" "}
                  {loc.region}, from {loc.cities[0]} to{" "}
                  {loc.cities[loc.cities.length - 1]}. We deliver premium,
                  freshly sanitized inflatable slides, set them up safely, and
                  pick them up when the fun's done. You bring the guests; we
                  handle everything else.
                </p>
              </Reveal>

              {/* Strategic anchor — the state's primary metro. */}
              <Reveal className="mt-4" delay={0.05}>
                <p className="text-muted-foreground leading-relaxed">
                  Our {loc.name} coverage is anchored in {anchor}, the state's
                  largest metro
                  {anchorNearby ? `, and reaches ${anchorNearby}` : ""} and
                  communities statewide. Wherever your event is in {loc.name},
                  we bring the slide, set it up, and pick it up — all from one
                  insured, sanitized fleet.
                </p>
              </Reveal>

              {/* The genuinely per-state part. Season, ground and demand differ
                  enormously between, say, Vermont and Arizona, and this is what
                  stops the 51 hubs reading as one page with the name swapped. */}
              {profile ? (
                <>
                  <Reveal className="mt-8" delay={0.05}>
                    <h2 className="text-foreground font-display text-xl font-bold">
                      Water slide season in {loc.name}
                    </h2>
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      <strong className="text-foreground/90">
                        {profile.season}.
                      </strong>{" "}
                      {profile.climate}
                    </p>
                  </Reveal>

                  <Reveal className="mt-6" delay={0.05}>
                    <h2 className="text-foreground font-display text-xl font-bold">
                      Ground, anchoring and access
                    </h2>
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      {profile.ground}
                    </p>
                  </Reveal>

                  <Reveal className="mt-6" delay={0.05}>
                    <h2 className="text-foreground font-display text-xl font-bold">
                      When {loc.name} dates fill
                    </h2>
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      {profile.demand}
                    </p>
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                      {profile.permits}
                    </p>
                  </Reveal>
                </>
              ) : null}

              {/* Three concrete slides from the fleet, linked inline. */}
              {picks.length === 3 ? (
                <Reveal className="mt-4" delay={0.05}>
                  <p className="text-muted-foreground leading-relaxed">
                    Not sure where to start? Three of the most-booked slides for{" "}
                    {loc.name} events right now are the{" "}
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
                    the daily rate, so you can match a slide to your venue
                    anywhere in {loc.name} before you request a quote.
                  </p>
                </Reveal>
              ) : null}
            </div>

            {/* Cities */}
            <div className="lg:col-span-5">
              <Reveal delay={0.05}>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Cities we serve in {loc.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {loc.cities.map((c) => (
                    <Link
                      key={c}
                      href={`/water-slide-rentals/${loc.slug}/${citySlug(c)}`}
                      className="border-border bg-background hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
                    >
                      <MapPin className="text-primary size-3.5" />
                      {c}
                    </Link>
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
            <SectionHeader
              title={`Popular water slides for ${loc.name} events`}
            />
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
          <SectionHeader title={`Water slide rentals in ${loc.name} — FAQ`} />
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

      {/* Planning guides — links this state hub into the blog. */}
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
                  <MapPin className="text-primary/70 size-4 shrink-0" />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* CTA + nearby states */}
      <Section
        spacing="compact"
        className="border-border bg-muted/40 border-t pb-16"
      >
        <Container className="max-w-[84rem]">
          <div className="overflow-hidden rounded-3xl px-6 py-12 text-center text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_100%)]">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Make a splash in {loc.name}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/75">
              Tell us your date and venue — we'll send a free, no-obligation
              quote with delivery, setup, and insurance included.
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
                <Link href={`/bounce-house-rentals/${loc.slug}`}>
                  Bounce houses in {loc.name}
                </Link>
              </Button>
            </div>
          </div>

          {nearby.length > 0 ? (
            <div className="mt-10">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                We also serve nearby
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nearby.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/water-slide-rentals/${s.slug}`}
                    className="border-border bg-background hover:border-primary hover:text-primary rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </Container>
      </Section>
    </main>
  );
}
