import { getTranslations } from "next-intl/server";
import { ShieldCheck, Sparkles, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Marquee } from "@/components/ui/marquee";

export async function TrustBand() {
  const t = await getTranslations("Home");

  const badges = [
    { icon: ShieldCheck, label: t("trustInsured") },
    { icon: Sparkles, label: t("trustClean") },
    { icon: Clock, label: t("trustOnTime") },
  ];

  const audiences = [
    "Families",
    "Birthday Parties",
    "Schools",
    "Churches",
    "Hotels",
    "Municipalities",
    "Festivals",
    "Corporate",
  ];

  return (
    <section className="border-y border-border bg-muted/40 py-6">
      <Container className="flex flex-col items-center gap-4">
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
        <p className="text-center text-sm text-muted-foreground">
          {t("trustServing")}
        </p>
      </Container>
      <div className="mt-4">
        <Marquee durationSeconds={30}>
          {audiences.map((a) => (
            <span
              key={a}
              className="text-lg font-semibold uppercase tracking-wide text-foreground/30"
            >
              {a} •
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
