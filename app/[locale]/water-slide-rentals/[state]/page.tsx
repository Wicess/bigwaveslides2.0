import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ShieldCheck, Sparkles, Truck, MapPin } from "lucide-react";
import { routing } from "@/i18n/routing";
import { US_STATES, getStateBySlug, citySlug } from "@/lib/locations";
import { getLandingRentals } from "@/server/data/rentals";
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

type Props = { params: Promise<{ locale: string; state: string }> };

const HERO =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/services/1782552093459-u6mqiy-event-rentals.jpg";

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
    // French location pages render English content (duplicates) — keep them out
    // of the index; English state hubs stay indexable.
    noindex: locale !== routing.defaultLocale,
    path: `/water-slide-rentals/${loc.slug}`,
    title: `Water Slide Rentals in ${loc.name} from $199/Day — Delivered & Insured`,
    description: `Rent inflatable water slides & bounce houses across ${loc.name} from $199/day — delivered, set up & fully insured in ${cities3} & statewide. Check your date free — summer weekends book fast.`,
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

  const items = await getLandingRentals();

  const cityList = loc.cities.join(", ");
  const path = `/water-slide-rentals/${loc.slug}`;
  const canonical = absoluteUrl(locale, path);

  // Strategic anchor = the state's largest-demand metro (the location's
  // strategic position within the state). Cities are population-ordered.
  const anchor = loc.cities[0]!;
  const anchorNearby = loc.cities.slice(1, 4).join(", ");

  // A few nearby states (same region) for internal linking.
  const nearby = US_STATES.filter(
    (s) => s.region === loc.region && s.slug !== loc.slug,
  ).slice(0, 6);

  const faqs = [
    {
      q: `Do you deliver water slides anywhere in ${loc.name}?`,
      a: `Yes — Big Wave Slides delivers, sets up, and picks up across ${loc.name}, including ${cityList}. Tell us your venue and date and we'll confirm delivery in your free quote.`,
    },
    {
      q: `How much does a water slide rental cost in ${loc.name}?`,
      a: `Pricing depends on the slide size, rental length, and your location in ${loc.name}. Most backyard rentals start around $295/day with delivery and setup included. Request a free, no-obligation quote for exact pricing.`,
    },
    {
      q: `How far in advance should I book in ${loc.name}?`,
      a: `Summer weekends in ${loc.name} book up fast. We recommend reserving 2–4 weeks ahead, though we'll always try to accommodate last-minute requests.`,
    },
    {
      q: `Are your slides insured and sanitized?`,
      a: `Every rental is fully insured and cleaned & sanitized before delivery, and installed by a trained crew with proper anchoring — so your ${loc.name} event is safe from start to finish.`,
    },
  ];

  const trust = [
    { icon: ShieldCheck, label: "Fully insured" },
    { icon: Sparkles, label: "Sanitized before delivery" },
    { icon: Truck, label: "Delivery & setup included" },
  ];

  return (
    <main>
      <JsonLd
        data={localBusinessAreaLd(loc.name, canonical, {
          city: anchor,
          region: loc.abbr,
        })}
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
          <Reveal className="max-w-3xl">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Looking for a water slide rental in {loc.name}? Big Wave Slides
              brings the waterpark to you — anywhere in the {loc.region}, from{" "}
              {loc.cities[0]} to {loc.cities[loc.cities.length - 1]}. We deliver
              premium, freshly sanitized inflatable slides, set them up safely,
              and pick them up when the fun's done. You bring the guests; we
              handle everything else.
            </p>
          </Reveal>

          {/* Strategic anchor — the state's primary metro. */}
          <Reveal className="mt-4 max-w-3xl" delay={0.05}>
            <p className="text-muted-foreground leading-relaxed">
              Our {loc.name} coverage is anchored in {anchor}, the state's
              largest metro{anchorNearby ? `, and reaches ${anchorNearby}` : ""}{" "}
              and communities statewide. Wherever your event is in {loc.name},
              we bring the slide, set it up, and pick it up — all from one
              insured, sanitized fleet.
            </p>
          </Reveal>

          {/* Cities */}
          <Reveal className="mt-6" delay={0.05}>
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

      {/* FAQ */}
      <Section spacing="compact" className="border-border border-t">
        <Container className="max-w-3xl">
          <SectionHeader
            title={`Water slide rentals in ${loc.name} — FAQ`}
            align="center"
          />
          <Accordion
            type="multiple"
            defaultValue={["q0"]}
            className="border-border mt-8 rounded-[var(--radius-lg)] border"
          >
            {faqs.map((f, i) => (
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
        </Container>
      </Section>

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
                <Link href="/rent">Browse rentals</Link>
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
