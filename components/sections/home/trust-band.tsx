import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Marquee } from "@/components/ui/marquee";

const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/partners";
const PARTNERS = [
  "33679843.jpg",
  "40036748.jpg",
  "52816299.jpg",
  "58899539.jpg",
  "75382947.jpg",
  "77574493.jpg",
  "90893822.jpg",
  "91429835.jpg",
].map((f) => `${R2}/${f}`);

export async function TrustBand() {
  const t = await getTranslations("Home");

  return (
    <section className="relative overflow-hidden border-b border-border bg-white py-12 sm:py-14">
      <Container>
        <p className="text-center text-sm font-bold uppercase tracking-[0.22em] text-primary">
          {t("ourPartners")}
        </p>
      </Container>

      {/* Logo wall — unified grayscale, scrolls left → right, colorizes on hover */}
      <div className="mt-8">
        <Marquee durationSeconds={44} reverse>
          {PARTNERS.map((src, i) => (
            <span
              key={src}
              className="group/logo grid h-16 w-32 shrink-0 place-items-center sm:h-20 sm:w-40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Partner ${i + 1}`}
                loading="lazy"
                className="max-h-full max-w-full object-contain opacity-60 grayscale transition-all duration-300 [mix-blend-mode:multiply] group-hover/logo:scale-105 group-hover/logo:opacity-100 group-hover/logo:grayscale-0"
              />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
