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

  const badges = [
    { icon: ShieldCheck, label: t("trustInsured") },
    { icon: Sparkles, label: t("trustClean") },
    { icon: Clock, label: t("trustOnTime") },
  ];

  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <Container className="flex flex-col items-center gap-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {badges.map((b) => (
            <span
              key={b.label}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <b.icon className="size-4 text-primary" />
              {b.label}
            </span>
          ))}
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("partnersTitle")}
        </p>
      </Container>

      <div className="mt-6">
        <Marquee durationSeconds={40}>
          {PARTNERS.map((src, i) => (
            <span
              key={src}
              className="grid h-20 w-36 shrink-0 place-items-center rounded-xl border border-border bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Partner ${i + 1}`}
                loading="lazy"
                className="max-h-full max-w-full object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
              />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
