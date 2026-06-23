import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { routing, type AppLocale } from "@/i18n/routing";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MapEmbed } from "@/components/ui/map-embed";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/forms/contact-form";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Contact" });
  return { title: t("title"), description: t("desc") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Contact");
  const settings = await getSettings().catch((): SiteSettings => ({}));
  const contact = settings.contact ?? {};
  const hours = settings.hours ?? {};

  const waDigits = (contact.whatsapp ?? contact.phone ?? "").replace(/\D/g, "");

  return (
    <main>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Form */}
            <Reveal>
              <Card className="p-6 sm:p-8">
                <ContactForm />
              </Card>
            </Reveal>

            {/* Info column */}
            <Reveal delay={0.08} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">{t("infoTitle")}</h2>
                <ul className="mt-4 space-y-4 text-sm">
                  {contact.email ? (
                    <li className="flex items-start gap-3">
                      <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-foreground hover:text-primary"
                      >
                        {contact.email}
                      </a>
                    </li>
                  ) : null}
                  {contact.phone ? (
                    <li className="flex items-start gap-3">
                      <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
                      <a
                        href={`tel:${contact.phone.replace(/\s/g, "")}`}
                        className="text-foreground hover:text-primary"
                      >
                        {contact.phone}
                      </a>
                    </li>
                  ) : null}
                  {contact.address ? (
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{contact.address}</span>
                    </li>
                  ) : null}
                </ul>

                <div className="mt-6 flex flex-wrap gap-3">
                  {waDigits ? (
                    <a
                      href={`https://wa.me/${waDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                    >
                      <MessageCircle className="size-4" />
                      {t("whatsappCta")}
                    </a>
                  ) : null}
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-[0.98]"
                    >
                      <Phone className="size-4" />
                      {t("callCta")}
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Hours */}
              {hours.mon_fri || hours.sat || hours.sun ? (
                <Card variant="glass" className="p-6">
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <Clock className="size-5 text-primary" />
                    {t("hoursTitle")}
                  </h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    {hours.mon_fri ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{t("monFri")}</dt>
                        <dd className="font-medium">{hours.mon_fri}</dd>
                      </div>
                    ) : null}
                    {hours.sat ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{t("sat")}</dt>
                        <dd className="font-medium">{hours.sat}</dd>
                      </div>
                    ) : null}
                    {hours.sun ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{t("sun")}</dt>
                        <dd className="font-medium">{hours.sun}</dd>
                      </div>
                    ) : null}
                  </dl>
                </Card>
              ) : null}
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Map */}
      {contact.address ? (
        <Section spacing="compact" className="pt-0">
          <Container>
            <Reveal>
              <MapEmbed
                query={contact.address}
                title={t("infoTitle")}
                className="h-[360px] rounded-[var(--radius-lg)] sm:h-[420px]"
              />
            </Reveal>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
