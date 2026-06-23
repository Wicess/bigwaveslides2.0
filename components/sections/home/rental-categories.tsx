import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { MediaImage } from "@/components/ui/media-image";

type Category = { slug: string; name: unknown; image: string | null };

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
    <Section spacing="compact" className="bg-muted/40">
      <Container>
        <SectionHeader
          eyebrow={t("categoriesEyebrow")}
          title={t("categoriesTitle")}
        />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.06}>
              <Link
                href={`/shop/category/${c.slug}`}
                className="group relative block aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)]"
              >
                {c.image ? (
                  <MediaImage
                    src={c.image}
                    alt={getLocalized(c.name, locale)}
                    className="absolute inset-0 size-full"
                    imgClassName="group-hover:scale-105"
                    sizes="(min-width:1024px) 33vw, 50vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-accent/80 via-accent/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 text-white">
                  <h3 className="font-display text-lg font-bold">
                    {getLocalized(c.name, locale)}
                  </h3>
                  <span className="grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-white group-hover:text-accent">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
