import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { ContactExperience } from "@/components/contact/contact-experience";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/contact",
    title: "Get a Free Water Slide Rental Quote — Contact Us",
    description:
      "Request a free water slide rental or purchase quote. Tell us your date, location and event — we reply within hours. Book your inflatable water slide today.",
    og: {
      eyebrow: "Free quote",
      subtitle: "Tell us your date, city and event — we reply within hours",
      badge: "No obligation",
      price: "From $199/day",
    },
    keywords: [
      "water slide rental quote",
      "book water slide online",
      "reserve water slide rental",
      "water slide booking",
    ],
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const settings = await getSettings().catch((): SiteSettings => ({}));
  const contact = settings.contact ?? {};
  const whatsappDigits = (contact.whatsapp ?? contact.phone ?? "").replace(
    /\D/g,
    "",
  );

  return (
    <main>
      <ContactExperience
        info={{
          email: contact.email,
          phone: contact.phone,
          whatsappDigits: whatsappDigits || undefined,
        }}
      />
    </main>
  );
}
