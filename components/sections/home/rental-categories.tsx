import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Marquee } from "@/components/ui/marquee";
import { MediaImage } from "@/components/ui/media-image";

type Category = {
  slug: string;
  name: unknown;
  description?: unknown;
  image?: string | null;
};

const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev";

/** Curated water-slide imagery per category (served from R2). */
const CATEGORY_IMAGES: Record<string, string> = {
  "inflatable-water-slides": `${R2}/categories/inflatable.jpg`,
  "slip-n-slides": `${R2}/categories/slip.jpg`,
  "combo-units": `${R2}/categories/combo.jpg`,
  "pool-slides": `${R2}/categories/pool.jpg`,
  "park-attractions": `${R2}/categories/park.jpg`,
};

type Card = {
  key: string;
  href: string;
  image?: string;
  title: string;
  desc: string;
};

export async function RentalCategories({
  categories,
  locale,
}: {
  categories: Category[];
  locale: string;
}) {
  const t = await getTranslations("Home");
  if (categories.length === 0) return null;

  const cards: Card[] = [
    ...categories.map((c) => ({
      key: c.slug,
      href: `/shop/category/${c.slug}`,
      image: CATEGORY_IMAGES[c.slug] ?? c.image ?? undefined,
      title: getLocalized(c.name, locale),
      desc: c.description ? getLocalized(c.description, locale) : "",
    })),
    // Extra themed collections — link to real browse pages.
    {
      key: "tropical",
      href: "/rent",
      image: `${R2}/featured/serengeti.jpg`,
      title: t("catTropicalTitle"),
      desc: t("catTropicalDesc"),
    },
    {
      key: "indoor",
      href: "/shop",
      image: `${R2}/featured/aquasplash.jpg`,
      title: t("catIndoorTitle"),
      desc: t("catIndoorDesc"),
    },
    {
      key: "racing",
      href: "/rent",
      image: `${R2}/featured/blaster.jpg`,
      title: t("catRacingTitle"),
      desc: t("catRacingDesc"),
    },
  ];

  return (
    <Section
      spacing="compact"
      className="overflow-hidden [background:var(--gradient-deep)]"
    >
      <Container>
        <h2 className="text-balance text-center text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
          {t("categoriesTitle")}
        </h2>
      </Container>

      {/* Infinite, auto-scrolling carousel (pauses on hover) */}
      <div className="mt-10">
        <Marquee durationSeconds={55}>
          {cards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="group relative flex aspect-[3/4] w-60 shrink-0 flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 text-white shadow-[0_14px_36px_-16px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:-translate-y-1"
            >
              {card.image ? (
                <MediaImage
                  src={card.image}
                  alt={card.title}
                  rounded={false}
                  className="absolute inset-0 size-full"
                  imgClassName="transition-transform duration-700 group-hover:scale-110"
                  sizes="240px"
                />
              ) : (
                <div className="absolute inset-0 bg-accent" />
              )}

              {/* Scrims for legible copy */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/75" />

              <h3 className="relative font-display text-lg font-bold leading-snug tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                {card.title}
              </h3>

              <div className="relative">
                {card.desc ? (
                  <p className="font-mono text-[11px] leading-relaxed text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                    {card.desc}
                  </p>
                ) : null}
                <span className="mt-3 inline-flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-white group-hover:text-accent">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </Marquee>
      </div>
    </Section>
  );
}
