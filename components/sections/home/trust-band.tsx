import { getTranslations } from "next-intl/server";
import { ShieldCheck, Sparkles, Clock } from "lucide-react";
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

  const features = [
    { icon: ShieldCheck, label: t("trustInsured") },
    { icon: Sparkles, label: t("trustClean") },
    { icon: Clock, label: t("trustOnTime") },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border bg-white">
      {/* faint wash so the band reads as its own quiet zone */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-50/40 via-white to-white" />

      <Container className="relative py-14 sm:py-16">
        {/* Trust features — a clean divided strip */}
        <div className="mx-auto grid max-w-3xl grid-cols-1 divide-y divide-border rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-center gap-3 px-6 py-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary">
                <f.icon className="size-5" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* Heading */}
        <div className="mt-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
            {t("partnersEyebrow")}
          </p>
          <h2 className="mt-2 text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("partnersHeading")}
          </h2>
        </div>
      </Container>

      {/* Logo wall — unified grayscale, colorizes on hover */}
      <div className="relative pb-14 sm:pb-16">
        <Marquee durationSeconds={44}>
          {PARTNERS.map((src, i) => (
            <span
              key={src}
              className="group/logo grid h-16 w-32 shrink-0 place-items-center sm:h-20 sm:w-40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Award or certification ${i + 1}`}
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
