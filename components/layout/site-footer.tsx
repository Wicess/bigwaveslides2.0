/*
 * SiteFooter — the footer shown at the bottom of every page.
 *
 * What it renders, top to bottom:
 *  1. A newsletter "band" with a heading and the email sign-up form.
 *  2. A four-column block: brand/logo + trust badges, an "Explore" link list,
 *     a "Services" link list, and a contact column with social buttons.
 *  3. A bottom bar with the copyright line and legal links.
 *
 * This is an async Server Component (note `async` and the `await` calls): it
 * runs on the server, so it fetches translations server-side and ships no
 * client JavaScript of its own. The newsletter form is the only interactive
 * (client) piece and lives in its own file.
 */
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
  // Helper to pick the correct-language text from a localized value.
  const loc = (v: unknown) => getLocalized(v, locale);
  // Contact and social settings come from the CMS; default to {} so reading a
  // missing field (e.g. contact.email) is safely `undefined` instead of crashing.
  const contact = data.settings.contact ?? {};
  const social = data.settings.social ?? {};

  // Static link lists, defined once here and mapped into the columns below.
  const exploreLinks = [
    { href: "/rent", label: tn("rent") },
    { href: "/shop", label: tn("shop") },
    { href: "/water-slide-rentals", label: "Service Areas" },
    { href: "/blog", label: tn("blog") },
    { href: "/about", label: tn("about") },
    { href: "/contact", label: tn("contact") },
  ];

  // Trust badges (icon + label). The icon is stored as a component reference
  // and rendered later as <item.icon /> inside the map.
  const trust = [
    { icon: ShieldCheck, label: t("insured") },
    { icon: Sparkles, label: t("clean") },
    { icon: Clock, label: t("onTime") },
  ];

  return (
    <footer className="bg-[#0a1a2f] text-white">
      {/* Newsletter band — a heading/description on the left and the sign-up
          form on the right. Stacks vertically on mobile, side-by-side on md+. */}
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

      {/* Main columns. The grid is responsive: a single column on mobile, two
          columns on md, and four uneven columns (brand wider, etc.) on lg+. */}
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-12">
        {/* Column 1: logo, tagline, and the trust badge list. */}
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
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
            {t("footerTagline")}
          </p>
          <ul className="mt-6 space-y-2.5">
            {trust.map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-sm text-white/80">
                <item.icon className="size-4 text-secondary" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: the "Explore" link list (built from exploreLinks above). */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            {t("footerExplore")}
          </h3>
          <ul className="mt-5 space-y-3">
            {exploreLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/75 transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: the "Services" list, showing the first 6 services. */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            {t("footerServices")}
          </h3>
          <ul className="mt-5 space-y-3">
            {data.services.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services#${s.slug}`}
                  className="text-sm text-white/75 transition-colors hover:text-white"
                >
                  {loc(s.title)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: contact details and social buttons. Each contact row is
            only rendered if that piece of info exists (the `? ... : null` guards). */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            {t("footerContact")}
          </h3>
          <ul className="mt-5 space-y-3.5 text-sm text-white/80">
            {contact.email ? (
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-secondary" />
                <a href={`mailto:${contact.email}`} className="hover:text-white">
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.phone ? (
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-secondary" />
                <a
                  /* Strip everything but digits and "+" to form a valid tel: link. */
                  href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                  className="hover:text-white"
                >
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-secondary" />
                {contact.address}
              </li>
            ) : null}
          </ul>

          {/* Social section — only shown if at least one social URL is set.
              Each individual button is likewise guarded by its own check. */}
          {social.instagram || social.facebook || social.tiktok ? (
            <div className="mt-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                {t("followUs")}
              </p>
              <div className="mt-3 flex gap-2.5">
                {social.instagram ? (
                  <SocialLink href={social.instagram} label="Instagram">
                    <InstagramIcon className="size-[18px]" />
                  </SocialLink>
                ) : null}
                {social.facebook ? (
                  <SocialLink href={social.facebook} label="Facebook">
                    <FacebookIcon className="size-[18px]" />
                  </SocialLink>
                ) : null}
                {social.tiktok ? (
                  <SocialLink href={social.tiktok} label="TikTok">
                    <TiktokIcon className="size-[18px]" />
                  </SocialLink>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </Container>

      {/* Bottom bar — copyright on one side, legal links on the other. */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-sm text-white/55 sm:flex-row">
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

/**
 * SocialLink — a circular icon button linking to a social profile. It opens in
 * a new tab (`target="_blank"`) and uses `rel="noopener noreferrer"`, a security
 * best practice that prevents the new page from accessing this window.
 */
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
      className="grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:ring-primary"
    >
      {children}
    </a>
  );
}
