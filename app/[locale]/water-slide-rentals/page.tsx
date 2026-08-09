import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, Sparkles, MapPin } from "lucide-react";
import { routing } from "@/i18n/routing";
import { US_STATES, getPriorityCities } from "@/lib/locations";
import { getLandingRentals } from "@/server/data/rentals";
import { buildMetadata } from "@/lib/seo";
import {
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

type Props = { params: Promise<{ locale: string }> };

// ISR: serve the cached page (stale-while-revalidate) so it stays up even when
// the serverless DB is asleep, and refreshes the featured slides within the hour.
export const revalidate = 3600;

const HERO =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/blog/1782479234273-ipwk85-overview-dream-space-water-park-chongqing-china-photo01-2048x1277.jpg";

const REGIONS = ["Northeast", "Midwest", "South", "West"] as const;

// High-intent "near me" / rental questions — answered concisely so they can be
// lifted straight into Google's FAQ rich results and AI answer engines.
const FAQS = [
  {
    q: "Do you rent water slides near me?",
    a: "Very likely — Big Wave Slides delivers to 50+ major U.S. metros and serves all 50 states. Pick your city below (or search your date on the rent page) to see local availability, delivery details, and pricing.",
  },
  {
    q: "How much does it cost to rent a water slide?",
    a: "Rentals start at $199/day. The exact price depends on the slide and your dates — delivery, professional setup, anchoring, sanitizing, and pickup are always included, with no hidden fees.",
  },
  {
    q: "Is delivery and setup included?",
    a: "Yes. Our team delivers, sets up, anchors, and safety-checks your slide, then returns to pack it all up. You just enjoy the day.",
  },
  {
    q: "How far in advance should I book a water slide rental?",
    a: "Summer and holiday weekends fill fast — we recommend booking 2–3 weeks ahead to lock your date. Checking your date is free and takes under a minute.",
  },
  {
    q: "Are your water slides insured and sanitized?",
    a: "Every unit is fully insured and thoroughly sanitized before each delivery. We're a licensed, insured operator — safety and cleanliness come first.",
  },
  {
    q: "What do I need for setup at my location?",
    a: "A flat, clear grass or turf area sized for the slide, a standard grounded outlet within about 50 ft (we can bring a generator), a garden-hose connection for water slides, and an adult present at delivery for the safety walkthrough.",
  },
] as const;

const TRUST = [
  { icon: ShieldCheck, label: "Fully insured" },
  { icon: Sparkles, label: "Sanitized before every delivery" },
  { icon: Truck, label: "Delivery, setup & pickup included" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/water-slide-rentals",
    title: "Water Slide Rentals Near You from $199/Day — All 50 States",
    description:
      "Rent premium inflatable water slides & bounce houses from $199/day — delivered, set up, sanitized & fully insured across all 50 U.S. states. Find your city, check your date free, and book before summer weekends fill.",
    keywords: [
      "water slide rentals",
      "water slide rental near me",
      "inflatable water slide rental USA",
      "bounce house and water slide rentals",
      "party water slide rental near me",
      "backyard water slide rental",
    ],
  });
}

export default async function LocationsHubPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const items = await getLandingRentals();
  const canonical = absoluteUrl(locale, "/water-slide-rentals");
  const cities = getPriorityCities();

  return (
    <main>
      {/* Structured data — breadcrumb, FAQ (rich results + AI answers), and the
          featured-slides ItemList. Sitewide LocalBusiness lives in the layout. */}
      <JsonLd
        data={breadcrumbLd([{ name: "Water Slide Rentals", url: canonical }])}
      />
      <JsonLd data={faqLd(FAQS.map((f) => ({ q: f.q, a: f.a })))} />
      {items.length > 0 ? (
        <JsonLd data={rentalItemListLd(locale, items)} />
      ) : null}

      <PhotoHero
        image={HERO}
        title="Water Slide Rentals Near You, Delivered"
        description="Premium, fully-insured inflatable water slides from $199/day — find your city, check your date free, and we deliver, set up, and pick up. Nationwide."
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Reveal className="max-w-3xl">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Looking for a water slide rental near you? Big Wave Slides
              delivers to 50+ major metros and every U.S. state —
              commercial-grade slides, delivered, set up, sanitized, and fully
              insured. Pick your city below or check your date to book in under
              a minute.
            </p>
            {/* Trust row */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {TRUST.map((t) => (
                <span
                  key={t.label}
                  className="text-foreground/80 inline-flex items-center gap-2 text-sm font-medium"
                >
                  <t.icon className="text-primary size-4" />
                  {t.label}
                </span>
              ))}
            </div>
            {/* Primary conversion CTAs */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link href="/rent">Check your date & browse slides</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Get a free quote</Link>
              </Button>
            </div>
          </Reveal>

          {/* Popular cities — direct internal links to the priority metro
              pages so they're crawlable within one click of the hub. */}
          <Reveal className="mt-12 space-y-4">
            <h2 className="text-primary flex items-center gap-3 text-sm font-semibold tracking-[0.18em] uppercase">
              <MapPin className="size-4" />
              Water slide rentals by city
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {cities.map((c) => (
                <Link
                  key={`${c.state.slug}/${c.slug}`}
                  href={`/water-slide-rentals/${c.state.slug}/${c.slug}`}
                  className="border-border bg-background hover:border-primary/40 hover:text-primary rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                >
                  {c.name}, {c.state.abbr}
                </Link>
              ))}
            </div>
          </Reveal>

          <div className="mt-10 space-y-10">
            {REGIONS.map((region) => (
              <Reveal key={region} className="space-y-4">
                <h2 className="text-primary flex items-center gap-3 text-sm font-semibold tracking-[0.18em] uppercase">
                  <span className="bg-primary/40 h-px w-8" />
                  {region}
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {US_STATES.filter((s) => s.region === region).map((s) => (
                    <Link
                      key={s.slug}
                      href={`/water-slide-rentals/${s.slug}`}
                      className="border-border bg-background hover:border-primary/40 hover:text-primary rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Top-rated slides — funnels hub authority + clicks into the money pages */}
      {items.length > 0 ? (
        <Section
          spacing="compact"
          className="border-border bg-muted/40 border-t"
        >
          <Container className="max-w-[84rem]">
            <SectionHeader
              title="Most-rented water slides"
              description="Our top-booked slides — available for delivery nationwide."
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

      {/* FAQ — feeds FAQPage schema + answers "near me" intent for AI engines */}
      <Section spacing="compact" className="border-border border-t">
        <Container className="max-w-[84rem]">
          <SectionHeader title="Water slide rentals near you — FAQ" />
          <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
            {[FAQS.slice(0, 3), FAQS.slice(3)].map((col, ci) => (
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
            ))}
          </div>

          {/* Closing conversion nudge */}
          <div className="mt-12 text-center">
            <h2 className="font-display text-2xl font-bold">
              Ready to make a splash?
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-xl">
              Check your date in under a minute — free, no obligation. Delivery,
              setup, and pickup included.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link href="/rent">Check availability</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Get a free quote</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
