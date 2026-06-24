import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Mail, Phone, MapPin, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
} from "@/components/icons/brand";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "./newsletter-form";
import type { NavData } from "@/server/data/navigation";

export async function SiteFooter({
  locale,
  data,
  year,
}: {
  locale: string;
  data: NavData;
  year: number;
}) {
  const t = await getTranslations("Layout");
  const tn = await getTranslations("Nav");
  const loc = (v: unknown) => getLocalized(v, locale);
  const contact = data.settings.contact ?? {};
  const social = data.settings.social ?? {};

  const exploreLinks = [
    { href: "/shop", label: tn("shop") },
    { href: "/rent", label: tn("rent") },
    { href: "/blog", label: tn("blog") },
    { href: "/about", label: tn("about") },
    { href: "/contact", label: tn("contact") },
  ];

  const trust = [
    { icon: ShieldCheck, label: t("insured") },
    { icon: Sparkles, label: t("clean") },
    { icon: Clock, label: t("onTime") },
  ];

  return (
    <footer className="bg-accent text-white">
      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <Container className="flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              {t("newsletterTitle")}
            </h2>
            <p className="mt-1 text-white/70">{t("newsletterDesc")}</p>
          </div>
          <NewsletterForm />
        </Container>
      </div>

      {/* Main */}
      <Container className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" aria-label="Big Wave Slides — home" className="inline-flex">
            <span className="rounded-2xl bg-white/95 px-3 py-2 shadow-[var(--shadow-soft)]">
              <Image
                src="/logo.png"
                alt="Big Wave Slides"
                width={170}
                height={144}
                className="h-14 w-auto"
              />
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-white/70">
            {t("footerTagline")}
          </p>
          <ul className="mt-5 space-y-2">
            {trust.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm text-white/80">
                <item.icon className="size-4 text-secondary" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
            {t("footerExplore")}
          </h3>
          <ul className="mt-4 space-y-2.5">
            {exploreLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
            {t("footerServices")}
          </h3>
          <ul className="mt-4 space-y-2.5">
            {data.services.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  {loc(s.title)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
            {t("footerContact")}
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {contact.email ? (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-secondary" />
                <a href={`mailto:${contact.email}`} className="hover:text-white">
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.phone ? (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-secondary" />
                <a
                  href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                  className="hover:text-white"
                >
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-secondary" />
                {contact.address}
              </li>
            ) : null}
          </ul>
          <div className="mt-5 flex gap-2">
            {social.instagram ? (
              <SocialLink href={social.instagram} label="Instagram">
                <InstagramIcon className="size-4" />
              </SocialLink>
            ) : null}
            {social.facebook ? (
              <SocialLink href={social.facebook} label="Facebook">
                <FacebookIcon className="size-4" />
              </SocialLink>
            ) : null}
            {social.tiktok ? (
              <SocialLink href={social.tiktok} label="TikTok">
                <TiktokIcon className="size-4" />
              </SocialLink>
            ) : null}
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-sm text-white/60 sm:flex-row">
          <p>
            © {year} Big Wave Slides. {t("footerRights")}
          </p>
          <div className="flex gap-5">
            <Link href="/faq" className="hover:text-white">
              {t("faq")}
            </Link>
            <Link href="/privacy-policy" className="hover:text-white">
              {t("privacy")}
            </Link>
            <Link href="/terms-of-service" className="hover:text-white">
              {t("terms")}
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
    >
      {children}
    </a>
  );
}
