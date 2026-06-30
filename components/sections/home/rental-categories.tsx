/*
 * RentalCategories
 * ----------------
 * A homepage section that shows a row of "category" cards (e.g. Inflatable
 * Water Slides, Slip-n-Slides, Combo Units). Each card is a photo with a title
 * and a short blurb, and clicking it links to that category's shop page.
 *
 * It renders two layouts depending on screen size:
 *   - On phones: a horizontal row you can swipe through (native scroll-snap).
 *   - On larger screens: an auto-scrolling marquee that loops forever.
 *
 * This is a Server Component (no "use client"), so the card markup is built on
 * the server. Appears on the homepage / landing page.
 */
import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Marquee } from "@/components/ui/marquee";

type Category = {
  slug: string;
  name: unknown;
  description?: unknown;
  image?: string | null;
};

// Base URL of our Cloudflare R2 bucket where all images are hosted.
// We serve images from R2 (the cloud) instead of the local /public folder.
const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev";

/**
 * Curated water-slide imagery per category (served from R2).
 * This maps a category's "slug" (its URL-friendly id) to a hand-picked photo,
 * so each category always shows a nice, on-brand image instead of whatever the
 * database happens to have.
 */
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

// A single clickable category card (photo + title + blurb + arrow button).
function CategoryCard({ card }: { card: Card }) {
  return (
    // Hover-focus effect: the row is a "group", and each card is its own
    // "group/card". When you hover ONE card, that card stays fully visible and
    // scales up (hover:!opacity-100 / hover:scale), while the others dim down
    // via group-hover:opacity-40. The result is the hovered card "pops" and the
    // rest fade back, drawing the eye to it.
    <Link
      href={card.href}
      className="group/card relative my-4 flex aspect-[3/4] w-60 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 text-white shadow-[0_14px_36px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-all duration-500 ease-out will-change-transform hover:!opacity-100 hover:scale-[1.04] hover:shadow-[0_28px_55px_-18px_rgba(0,0,0,0.8)] hover:ring-white/50 group-hover:opacity-40"
    >
      {/* Background photo (slowly zooms in on hover). Falls back to a solid
          accent-colored panel if the card has no image. Served straight from R2
          at full original quality (no resizing) so these hero category cards
          stay crisp. */}
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.image}
          alt={card.title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-accent" />
      )}

      {/* Scrims for legible copy — lift a touch on hover so the photo pops */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/75 transition-opacity duration-500 group-hover/card:opacity-75" />

      <h3 className="relative font-display text-lg font-bold leading-snug tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
        {card.title}
      </h3>

      <div className="relative">
        {card.desc ? (
          <p className="font-mono text-[11px] leading-relaxed text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {card.desc}
          </p>
        ) : null}
        <span className="mt-3 inline-flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors duration-300 group-hover/card:bg-white group-hover/card:text-accent">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

export async function RentalCategories({
  categories,
  locale,
}: {
  categories: Category[];
  locale: string;
}) {
  // "t" looks up translated text for the current language under the "Home" key.
  const t = await getTranslations("Home");
  // Nothing to show if there are no categories — render nothing.
  if (categories.length === 0) return null;

  // Build the list of cards we'll display.
  const cards: Card[] = [
    // First, one card per real category from the database. For the image we
    // prefer our curated R2 photo; if there isn't one, fall back to the
    // category's own image, and if that's missing too, leave it undefined.
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
      className="overflow-hidden [background:linear-gradient(180deg,#0a1a2f_0%,#0e2742_100%)]"
    >
      <Container>
        <h2 className="text-balance text-center text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
          {t("categoriesTitle")}
        </h2>
      </Container>

      {/* Mobile (hidden on sm+ screens): a horizontal strip you swipe through.
          "snap-x snap-mandatory" makes each card snap neatly into place as you
          scroll. The scrollbar is hidden for a cleaner look. */}
      <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((card) => (
          <CategoryCard key={card.key} card={card} />
        ))}
      </div>

      {/* Desktop (sm+ only): the same cards in a Marquee that auto-scrolls
          forever. durationSeconds controls how long one full loop takes; the
          Marquee component pauses the animation on hover. */}
      <div className="mt-8 hidden sm:block">
        <Marquee durationSeconds={55}>
          {cards.map((card) => (
            <CategoryCard key={card.key} card={card} />
          ))}
        </Marquee>
      </div>
    </Section>
  );
}
