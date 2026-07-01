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
import { getAllCities, getCity, citySlug } from "@/lib/locations";
import { getRentalProducts } from "@/server/data/rentals";
import { buildMetadata } from "@/lib/seo";
import {
  localBusinessAreaLd,
  breadcrumbLd,
  faqLd,
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

type Props = {
  params: Promise<{ locale: string; state: string; city: string }>;
};

const HERO =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/services/1782552093459-u6mqiy-event-rentals.jpg";

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
  return buildMetadata({
    locale,
    path: `/water-slide-rentals/${st.slug}/${loc.slug}`,
    title: `Water Slide Rentals in ${name}, ${st.abbr} — Delivered & Set Up`,
    description: `Rent premium inflatable water slides in ${name}, ${st.name}. Delivery, setup, pickup and insurance included — for birthday parties, backyard, church, school and community events. Get a free ${name} water slide rental quote today.`,
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

  const listing = await getRentalProducts({ sort: "featured", page: 1 }).catch(
    () => ({
      items: [] as Awaited<ReturnType<typeof getRentalProducts>>["items"],
    }),
  );
  const items = listing.items.slice(0, 8);

  const path = `/water-slide-rentals/${st.slug}/${loc.slug}`;
  const canonical = absoluteUrl(locale, path);
  const place = `${name}, ${st.abbr}`;

  // Sibling cities in the same state for internal linking.
  const siblings = st.cities.filter((c) => citySlug(c) !== loc.slug);

  const faqs = [
    {
      q: `Do you deliver water slides in ${name}?`,
      a: `Yes — Big Wave Slides delivers, sets up, and picks up water slides throughout ${name} and the surrounding ${st.name} area. Share your venue and date and we'll confirm delivery in your free quote.`,
    },
    {
      q: `How much does a water slide rental cost in ${name}?`,
      a: `Pricing in ${name} depends on the slide size and how long you rent it. Most backyard rentals start around $295/day with delivery, setup, and insurance included. Request a free, no-obligation quote for exact ${place} pricing.`,
    },
    {
      q: `What events do you cover in ${name}?`,
      a: `Everything — ${OCCASIONS.join(", ")}, church festivals, carnivals and more. If you're hosting it in ${name}, we can make it a splash.`,
    },
    {
      q: `Are your ${name} rentals insured and sanitized?`,
      a: `Every rental is fully insured and cleaned & sanitized before delivery, then installed by a trained crew with proper anchoring — so your ${name} event is safe from start to finish.`,
    },
  ];

  const trust = [
    { icon: ShieldCheck, label: "Fully insured" },
    { icon: Sparkles, label: "Sanitized before delivery" },
    { icon: Truck, label: "Delivery & setup included" },
  ];

  return (
    <main>
      <JsonLd data={localBusinessAreaLd(place, canonical)} />
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

      <PhotoHero
        image={HERO}
        title={`Water Slide Rentals in ${name}, ${st.abbr}`}
        description={`Commercial-grade inflatable water slides delivered, set up, and picked up across ${name}. Perfect for birthdays, backyard bashes, schools, churches, and community events.`}
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Reveal className="max-w-3xl">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Planning a party in {name}? Big Wave Slides brings the waterpark
              to your {name} backyard, park, school, or church. We deliver
              premium, freshly sanitized inflatable water slides across{" "}
              {st.name}, set them up safely, and pick them up when the fun's
              done — so all you do is enjoy the day.
            </p>
          </Reveal>

          {/* Occasions */}
          <Reveal className="mt-6" delay={0.05}>
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

      {/* FAQ */}
      <Section spacing="compact" className="border-border border-t">
        <Container className="max-w-3xl">
          <SectionHeader
            title={`Water slide rentals in ${name} — FAQ`}
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
                <Link href="/rent">Browse rentals</Link>
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
