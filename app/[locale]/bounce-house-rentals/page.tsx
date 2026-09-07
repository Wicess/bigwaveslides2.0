import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, Home, MapPin, Sparkles } from "lucide-react";
import { routing } from "@/i18n/routing";
import { US_STATES, isBounceState } from "@/lib/locations";
import { getBounceContent, bounceKeywords } from "@/lib/bounce-houses";
import { getLandingBounceHouses } from "@/server/data/rentals";
import { buildMetadata } from "@/lib/seo";
import {
  breadcrumbLd,
  faqLd,
  rentalItemListLd,
  serviceLd,
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

// See the note on the blog pages: widened because revalidateTag("products")
// makes catalog edits appear immediately, so this window is only a backstop.
export const revalidate = 21600;

type Props = { params: Promise<{ locale: string }> };

const REGIONS = ["Northeast", "Midwest", "South", "West"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/bounce-house-rentals",
    title: "Bounce House Rentals Near You — From $165/Day, USA",
    description:
      "Bounce house & bounce-and-slide combo rentals from $165/day in all 50 states — delivered, set up, sanitized & insured. Indoor or outdoor, all year.",
    og: {
      eyebrow: "All 50 states",
      subtitle: "Themed castles, toddler bouncers and combo units",
      badge: "Nationwide",
      price: "From $165/day",
    },
    keywords: [
      ...bounceKeywords("USA"),
      "bounce house rentals",
      "bouncy castle hire near me",
      "inflatable rentals near me",
      "party rentals near me",
    ],
  });
}

export default async function BounceHubPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const items = await getLandingBounceHouses();
  const path = "/bounce-house-rentals";
  const canonical = absoluteUrl(locale, path);
  // The states that kept a bounce-house hub. Everything else in this family
  // redirects to this page — see BOUNCE_STATE_KEYS.
  const bounceStates = US_STATES.filter((s) => isBounceState(s.slug));
  // Reuse the shared FAQ set so the hub answers the same questions the location
  // pages do — one source of truth, and the answers stay consistent wherever an
  // answer engine picks them up.
  const { faqs } = getBounceContent("usa-hub", "the U.S.", "the U.S.", "South");

  const trust = [
    { icon: ShieldCheck, label: "Fully insured" },
    { icon: Sparkles, label: "Sanitized before delivery" },
    { icon: Truck, label: "Delivery, setup & pickup included" },
    { icon: Home, label: "Indoor or outdoor" },
  ];

  return (
    <main>
      <JsonLd
        data={serviceLd({
          name: "Bounce House Rentals",
          description:
            "Commercial-grade inflatable bounce house and bounce-and-slide combo rentals, delivered, professionally set up, sanitized and fully insured across all 50 U.S. states.",
          url: canonical,
        })}
      />
      <JsonLd
        data={breadcrumbLd([{ name: "Bounce House Rentals", url: canonical }])}
      />
      <JsonLd data={faqLd(faqs)} />
      {items.length > 0 ? (
        <JsonLd data={rentalItemListLd(locale, items)} />
      ) : null}

      <PhotoHero
        image="https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/products/1783340836997-6q9pmj-circus-big-top-bounce-castle-202607061305.jpeg"
        title="Bounce House Rentals Near You"
        description="Themed castles, toddler bouncers and bounce-and-slide combos — delivered, set up, sanitized and fully insured in all 50 states. From $165/day."
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Breadcrumbs
            className="mb-8"
            items={[
              { label: "Home", href: "/" },
              { label: "Bounce house rentals" },
            ]}
          />
          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  A bounce house is the most flexible inflatable we deliver, and
                  the reason is simple: it runs dry. No hose, no swimsuits, no
                  waiting for a warm weekend — which makes it the one unit that
                  works in a March church hall as well as a July backyard. Big
                  Wave Slides delivers commercial-grade bouncers and combo units
                  to all 50 states, anchors them properly, and picks them up
                  afterwards.
                </p>
              </Reveal>
              <Reveal className="mt-4" delay={0.05}>
                <p className="text-muted-foreground leading-relaxed">
                  Rentals start at $165 per day. Themed castles — unicorn,
                  circus, farm, candy, royal — run about $240–$295, and
                  bounce-and-slide combo units, which add a slide and often a
                  basketball hoop to the same footprint, run about $280–$570.
                  Every price includes delivery, professional setup and
                  anchoring, sanitizing before drop-off, full insurance and
                  pickup. Nothing is added at the door.
                </p>
              </Reveal>
              <Reveal className="mt-4" delay={0.05}>
                <p className="text-muted-foreground leading-relaxed">
                  Planning something for the summer instead? Our combo units run
                  wet or dry, and we rent full-size inflatable{" "}
                  <Link
                    href="/water-slide-rentals"
                    className="text-primary font-medium underline underline-offset-4 hover:no-underline"
                  >
                    water slides nationwide
                  </Link>{" "}
                  as well.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={0.05}>
                {/* States, not metros: the bounce-house city pages are gone
                    (see BOUNCE_STATE_KEYS) and these chips pointed straight at
                    them. */}
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Where we deliver most
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bounceStates.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/bounce-house-rentals/${s.slug}`}
                      className="border-border bg-background hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
                    >
                      <MapPin className="text-primary size-3.5" />
                      {s.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>

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

      {items.length > 0 ? (
        <Section
          spacing="compact"
          className="border-border bg-muted/40 border-t"
        >
          <Container className="max-w-[84rem]">
            <SectionHeader title="Most-booked bounce houses & combos" />
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
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link href="/rent?category=bounce-houses">
                  Browse all bounce houses
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/rent?category=combo-units">See combo units</Link>
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* State directory — the hub-and-spoke link graph that makes 51 state
          pages (and the city pages beneath them) reachable in two clicks. */}
      <Section spacing="compact" className="border-border border-t">
        <Container className="max-w-[84rem]">
          <SectionHeader title="Bounce house rentals by state" />
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Only regions that still have a state hub — filtering the states
                without this would leave the Midwest and Northeast columns as a
                heading over nothing. */}
            {REGIONS.filter((r) =>
              bounceStates.some((s) => s.region === r),
            ).map((region) => (
              <div key={region}>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {region}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {bounceStates
                    .filter((s) => s.region === region)
                    .map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/bounce-house-rentals/${s.slug}`}
                          className="hover:text-primary text-sm transition-colors"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="compact" className="border-border border-t">
        <Container className="max-w-[84rem]">
          <SectionHeader title="Bounce house rental FAQ" />
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

      <Section
        spacing="compact"
        className="border-border bg-muted/40 border-t pb-16"
      >
        <Container className="max-w-[84rem]">
          <div className="overflow-hidden rounded-3xl px-6 py-12 text-center text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_100%)]">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Get a free bounce house quote
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/75">
              Tell us your date, city and venue — we&apos;ll come back with an
              exact price including delivery, setup and insurance.
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
                <Link href="/water-slide-rentals">Water slide rentals</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
