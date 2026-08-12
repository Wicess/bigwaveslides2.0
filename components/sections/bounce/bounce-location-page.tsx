import {
  ShieldCheck,
  Sparkles,
  Truck,
  Home,
  MapPin,
  Waves,
} from "lucide-react";
import type { BounceContent } from "@/lib/bounce-houses";
import { getLocalized } from "@/lib/localized";
import type { RentalListing } from "@/server/data/rentals";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
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

const TRUST = [
  { icon: ShieldCheck, label: "Fully insured" },
  { icon: Sparkles, label: "Sanitized before delivery" },
  { icon: Truck, label: "Delivery, setup & pickup included" },
  { icon: Home, label: "Indoor or outdoor" },
];

export type LinkChip = { href: string; label: string };

/**
 * Shared body for the bounce-house state and city landing pages.
 *
 * The two routes differ only in what "place" means and which chips they list,
 * so the markup lives here once. Keeping it in a single component also keeps
 * the two page families honest: any copy change lands on both at the same time
 * and can't drift into two near-identical-but-subtly-different templates.
 */
export function BounceLocationPage({
  locale,
  place,
  headline,
  content,
  items,
  crumbs,
  chipsTitle,
  chips,
  waterSlideHref,
  waterSlideLabel,
  guides,
  ctaTitle,
}: {
  locale: string;
  /** Bare place name used inside sentences, e.g. "Houston" or "Texas". */
  place: string;
  /** Full H1, e.g. "Bounce House Rentals in Houston, TX". */
  headline: string;
  content: BounceContent;
  items: RentalListing["items"];
  crumbs: Crumb[];
  chipsTitle: string;
  chips: LinkChip[];
  /** The matching water-slide page — complement, not competitor. */
  waterSlideHref: string;
  waterSlideLabel: string;
  guides: { slug: string; title: unknown }[];
  ctaTitle: string;
}) {
  return (
    <>
      <PhotoHero
        image={content.hero}
        title={headline}
        description={content.heroDescription}
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Breadcrumbs className="mb-8" items={crumbs} />

          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {content.intro}
                </p>
              </Reveal>

              <Reveal className="mt-4" delay={0.05}>
                <p className="text-muted-foreground leading-relaxed">
                  {content.seasonal}
                </p>
              </Reveal>

              {/* The complementary water-slide page. Two families over the same
                  city only work if they point at each other instead of quietly
                  competing for the same click. */}
              <Reveal className="mt-4" delay={0.05}>
                <p className="text-muted-foreground leading-relaxed">
                  Want the wet version? Most of our combo units run wet or dry,
                  and we rent full inflatable water slides in {place} too — see{" "}
                  <Link
                    href={waterSlideHref}
                    className="text-primary font-medium underline underline-offset-4 hover:no-underline"
                  >
                    {waterSlideLabel}
                  </Link>{" "}
                  if the forecast is on your side.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={0.05}>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {chipsTitle}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className="border-border bg-background hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
                    >
                      <MapPin className="text-primary size-3.5" />
                      {c.label}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>

          <ul className="border-border mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y py-4 text-sm">
            {TRUST.map((it) => {
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

      {/* Catalog — bounce houses and combos only, never the water-slide grid. */}
      {items.length > 0 ? (
        <Section
          spacing="compact"
          className="border-border bg-muted/40 border-t"
        >
          <Container className="max-w-[84rem]">
            <SectionHeader
              title={`Bounce houses & combos for ${place} parties`}
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

      <Section spacing="compact" className="border-border border-t">
        <Container className="max-w-[84rem]">
          <SectionHeader title={`Bounce house rentals in ${place} — FAQ`} />
          <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
            {[
              content.faqs.slice(0, Math.ceil(content.faqs.length / 2)),
              content.faqs.slice(Math.ceil(content.faqs.length / 2)),
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

      {guides.length > 0 ? (
        <Section spacing="compact" className="border-border border-t">
          <Container className="max-w-[84rem]">
            <SectionHeader title="Party planning guides & tips" />
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
                  <Waves className="text-primary/70 size-4 shrink-0" />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section
        spacing="compact"
        className="border-border bg-muted/40 border-t pb-16"
      >
        <Container className="max-w-[84rem]">
          <div className="overflow-hidden rounded-3xl px-6 py-12 text-center text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_100%)]">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              {ctaTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/75">
              Tell us your date and venue — we&apos;ll send a free,
              no-obligation quote with delivery, setup and insurance included.
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
                <Link href={waterSlideHref}>Water slides in {place}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
