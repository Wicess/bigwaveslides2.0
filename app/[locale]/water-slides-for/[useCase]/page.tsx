import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ShieldCheck, Sparkles, Truck, Check } from "lucide-react";
import { routing } from "@/i18n/routing";
import { USE_CASES, getUseCaseBySlug } from "@/lib/use-cases";
import { getRentalProducts } from "@/server/data/rentals";
import { buildMetadata } from "@/lib/seo";
import {
  serviceLd,
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

// ISR: serve the cached page (stale-while-revalidate) so it stays up even
// when the serverless DB is asleep, and refreshes catalog data within the hour.
export const revalidate = 3600;


type Props = { params: Promise<{ locale: string; useCase: string }> };

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ useCase: u.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, useCase } = await params;
  const uc = getUseCaseBySlug(useCase);
  if (!uc) return {};
  return buildMetadata({
    locale,
    // Use-case pages render English copy; keep the French duplicates unindexed.
    noindex: locale !== routing.defaultLocale,
    path: `/water-slides-for/${uc.slug}`,
    title: uc.heroTitle,
    description: uc.heroDescription,
    image: uc.hero,
    keywords: uc.keywords,
  });
}

export default async function UseCasePage({ params }: Props) {
  const { locale, useCase } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const uc = getUseCaseBySlug(useCase);
  if (!uc) notFound();

  const listing = await getRentalProducts({ sort: "featured", page: 1 }).catch(
    () => ({
      items: [] as Awaited<ReturnType<typeof getRentalProducts>>["items"],
    }),
  );
  const items = listing.items.slice(0, 8);

  const path = `/water-slides-for/${uc.slug}`;
  const canonical = absoluteUrl(locale, path);

  // Other use cases for internal linking.
  const others = USE_CASES.filter((u) => u.slug !== uc.slug);

  const trust = [
    { icon: ShieldCheck, label: "Fully insured" },
    { icon: Sparkles, label: "Sanitized before delivery" },
    { icon: Truck, label: "Delivery & setup included" },
  ];

  return (
    <main>
      <JsonLd
        data={serviceLd({
          name: uc.heroTitle,
          description: uc.heroDescription,
          url: canonical,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          {
            name: "Water Slide Rentals",
            url: absoluteUrl(locale, "/water-slide-rentals"),
          },
          { name: uc.name, url: canonical },
        ])}
      />
      <JsonLd data={faqLd(uc.faqs)} />

      <PhotoHero
        image={uc.hero}
        title={uc.heroTitle}
        description={uc.heroDescription}
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Reveal className="max-w-3xl">
            <p className="text-muted-foreground text-lg leading-relaxed">
              {uc.intro}
            </p>
          </Reveal>

          {/* Benefits */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {uc.benefits.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 0.05}>
                <div className="border-border bg-background h-full rounded-2xl border p-5">
                  <Check className="text-primary size-5" />
                  <h3 className="font-display mt-3 text-lg font-semibold">
                    {b.title}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {b.body}
                  </p>
                </div>
              </Reveal>
            ))}
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
              title={`Popular slides for ${uc.name.toLowerCase()}`}
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
            title={`${uc.name} — frequently asked questions`}
            align="center"
          />
          <Accordion
            type="multiple"
            defaultValue={["q0"]}
            className="border-border mt-8 rounded-[var(--radius-lg)] border"
          >
            {uc.faqs.map((f, i) => (
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

      {/* CTA + other use cases */}
      <Section
        spacing="compact"
        className="border-border bg-muted/40 border-t pb-16"
      >
        <Container className="max-w-[84rem]">
          <div className="overflow-hidden rounded-3xl px-6 py-12 text-center text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_100%)]">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Planning a {uc.phrase}?
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

          <div className="mt-10">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Water slides for every occasion
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {others.map((u) => (
                <Link
                  key={u.slug}
                  href={`/water-slides-for/${u.slug}`}
                  className="border-border bg-background hover:border-primary hover:text-primary rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
                >
                  {u.name}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
