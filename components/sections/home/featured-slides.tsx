import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard, type CardProduct } from "@/components/shop/product-card";

export async function FeaturedSlides({
  products,
  locale,
}: {
  products: CardProduct[];
  locale: string;
}) {
  const t = await getTranslations("Home");
  if (products.length === 0) return null;

  return (
    <Section>
      <Container>
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            eyebrow={t("featuredEyebrow")}
            title={t("featuredTitle")}
            description={t("featuredDesc")}
          />
          <Link
            href="/shop"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
          >
            {t("featuredEyebrow")} <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
          {products.slice(0, 4).map((product, i) => (
            <Reveal key={product.slug} delay={i * 0.08}>
              <ProductCard product={product} locale={locale} priority={i < 2} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
