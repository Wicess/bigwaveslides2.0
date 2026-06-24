import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { ContactExperience } from "@/components/contact/contact-experience";

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

  const settings = await getSettings().catch((): SiteSettings => ({}));
  const contact = settings.contact ?? {};
  const whatsappDigits = (contact.whatsapp ?? contact.phone ?? "").replace(/\D/g, "");

  return (
    <main>
      <ContactExperience
        info={{
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          whatsappDigits: whatsappDigits || undefined,
        }}
      />
    </main>
  );
}
