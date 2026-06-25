import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { MediaImage } from "@/components/ui/media-image";

type Category = {
  slug: string;
  name: unknown;
  description?: unknown;
  image?: string | null;
};

const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/categories";

/** Curated water-slide imagery per category (served from R2). */
const CATEGORY_IMAGES: Record<string, string> = {
  "inflatable-water-slides": `${R2}/inflatable.jpg`,
  "slip-n-slides": `${R2}/slip.jpg`,
  "combo-units": `${R2}/combo.jpg`,
  "pool-slides": `${R2}/pool.jpg`,
  "park-attractions": `${R2}/park.jpg`,
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

  return (
    <Section spacing="compact" className="bg-primary-50">
      <Container>
        <SectionHeader
          eyebrow={t("categoriesEyebrow")}
          title={t("categoriesTitle")}
        />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {categories.map((c, i) => {
            const name = getLocalized(c.name, locale);
            const desc = c.description ? getLocalized(c.description, locale) : "";
            const src = CATEGORY_IMAGES[c.slug] ?? c.image ?? undefined;

            return (
              <Reveal key={c.slug} delay={i * 0.06}>
                <Link
                  href={`/shop/category/${c.slug}`}
                  className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 text-white shadow-[0_10px_30px_-12px_rgba(0,51,102,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-15px_rgba(0,51,102,0.5)]"
                >
                  {/* Image */}
                  {src ? (
                    <MediaImage
                      src={src}
                      alt={name}
                      className="absolute inset-0 size-full"
                      imgClassName="transition-transform duration-700 group-hover:scale-110"
                      sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-accent" />
                  )}

                  {/* Scrims — darken top & bottom for legible copy */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/75" />

                  {/* Top: title */}
                  <h3 className="relative font-display text-lg font-bold leading-snug tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-xl">
                    {name}
                  </h3>

                  {/* Bottom: description (mono) + arrow */}
                  <div className="relative">
                    {desc ? (
                      <p className="font-mono text-[11px] leading-relaxed text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] sm:text-xs">
                        {desc}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-white group-hover:text-accent">
                      <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
