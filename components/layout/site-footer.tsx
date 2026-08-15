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
import { BRAND_EMAIL } from "@/lib/brand";
import Image from "next/image";
import { Mail, Phone, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
} from "@/components/icons/brand";
import { getLocalized } from "@/lib/localized";
import { getCity } from "@/lib/locations";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "./newsletter-form";
import type { NavData } from "@/server/data/navigation";

// Top rental metros linked from every page — pushes internal link equity at
// the highest-demand city landing pages (the site's proven converters) and
// keeps them one click from anywhere. Keys are "stateSlug/citySlug" from the
// priority set in lib/locations.
const FOOTER_CITY_KEYS = [
  "texas/dallas",
  "texas/houston",
  "texas/austin",
  "california/los-angeles",
  "florida/orlando",
  "florida/miami",
  "arizona/phoenix",
  "georgia/atlanta",
  "illinois/chicago",
  "north-carolina/charlotte",
  "tennessee/nashville",
  "missouri/kansas-city",
];

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
  // Fall back to the brand's own address when Settings has no contact row.
  // The footer is where a visitor looks for who to email; showing nothing
  // there reads as an abandoned site, and after the rebrand Settings was empty.
  const contact = {
    ...data.settings.contact,
    email: data.settings.contact?.email || BRAND_EMAIL,
  };
  const social = data.settings.social ?? {};

  // Static link lists, defined once here and mapped into the columns below.
  const exploreLinks = [
    { href: "/rent", label: tn("rent") },
    { href: "/shop", label: tn("shop") },
    { href: "/water-slide-rentals", label: "Service Areas" },
    // Sitewide entry point into the bounce-house family. A programmatic page
    // set that is only reachable from its own sitemap is an orphan cluster —
    // Google crawls it far more slowly and passes it almost no equity.
    { href: "/bounce-house-rentals", label: "Bounce House Rentals" },
    { href: "/water-slides-for", label: "Occasions" },
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
          <Link
            href="/"
            aria-label="Splash Republic — home"
            className="inline-flex"
          >
            <span className="rounded-2xl bg-white/95 px-3 py-2 shadow-[var(--shadow-soft)]">
              <Image
                src="/logo.png"
                alt="Splash Republic"
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
              <li
                key={item.label}
                className="flex items-center gap-2.5 text-sm text-white/80"
              >
                <item.icon className="text-secondary size-4" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: the "Explore" link list (built from exploreLinks above). */}
        <div>
          <h3 className="text-xs font-bold tracking-[0.18em] text-white/50 uppercase">
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
          <h3 className="text-xs font-bold tracking-[0.18em] text-white/50 uppercase">
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
          <h3 className="text-xs font-bold tracking-[0.18em] text-white/50 uppercase">
            {t("footerContact")}
          </h3>
          <ul className="mt-5 space-y-3.5 text-sm text-white/80">
            {contact.email ? (
              <li className="flex items-center gap-2.5">
                <Mail className="text-secondary size-4 shrink-0" />
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-white"
                >
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.phone ? (
              <li className="flex items-center gap-2.5">
                <Phone className="text-secondary size-4 shrink-0" />
                <a
                  /* Strip everything but digits and "+" to form a valid tel: link. */
                  href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                  className="hover:text-white"
                >
                  {contact.phone}
                </a>
              </li>
            ) : null}
          </ul>

          {/* Social section — icons are always shown. Each one is an active
              link only when its URL is set in the admin panel; otherwise it
              renders inactive (dimmed, non-clickable) until a link is added. */}
          <div className="mt-7">
            <p className="text-xs font-bold tracking-[0.18em] text-white/50 uppercase">
              {t("followUs")}
            </p>
            <div className="mt-3 flex gap-2.5">
              <SocialLink href={social.instagram} label="Instagram">
                <InstagramIcon className="size-[18px]" />
              </SocialLink>
              <SocialLink href={social.facebook} label="Facebook">
                <FacebookIcon className="size-[18px]" />
              </SocialLink>
              <SocialLink href={social.tiktok} label="TikTok">
                <TiktokIcon className="size-[18px]" />
              </SocialLink>
            </div>
          </div>
        </div>
      </Container>

      {/* Top rental cities — internal links to the highest-demand city pages. */}
      <div className="border-t border-white/10">
        <Container className="py-6">
          <p className="text-xs font-bold tracking-[0.18em] text-white/50 uppercase">
            Top rental cities
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {FOOTER_CITY_KEYS.map((key) => {
              const [stateSlug, citySlug] = key.split("/") as [string, string];
              const c = getCity(stateSlug, citySlug);
              if (!c) return null;
              return (
                <li key={key}>
                  <Link
                    href={`/water-slide-rentals/${stateSlug}/${citySlug}`}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {c.name}, {c.state.abbr}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/water-slide-rentals"
                className="text-secondary text-sm font-semibold hover:text-white"
              >
                All cities →
              </Link>
            </li>
          </ul>
        </Container>
      </div>

      {/* Bottom bar — copyright on one side, legal links on the other. */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-sm text-white/55 sm:flex-row">
          <p>
            © {year} Splash Republic. {t("footerRights")}
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

          {/* Developer signature — Wun GATA is a mailto backlink; the wordmark
              wears a slow metallic sheen. Left on mobile, right on desktop. */}
          <a
            href="mailto:kenj52974@gmail.com"
            aria-label="Contact the developer, Wun GATA"
            className="group inline-flex items-baseline gap-2 self-start sm:self-auto"
          >
            <span className="text-[10px] font-medium tracking-[0.4em] text-white/30 uppercase transition-opacity duration-300 group-hover:text-white/60">
              Crafted by
            </span>
            <span className="dev-sheen font-brand text-base leading-none font-bold">
              Wun GATA
            </span>
          </a>
        </Container>
      </div>
    </footer>
  );
}

/**
 * SocialLink — a circular icon button for a social profile. When `href` is set
 * (via the admin panel) it's an active link that opens in a new tab with the
 * `rel="noopener noreferrer"` security best practice. When no link is set it
 * renders inactive: dimmed and non-clickable, so the icon is always visible but
 * only "lights up" once a real URL is added in the admin panel.
 */
function SocialLink({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  // Inactive state — no link configured yet.
  if (!href) {
    return (
      <span
        aria-label={`${label} (not linked yet)`}
        aria-disabled="true"
        className="grid size-11 cursor-default place-items-center rounded-full bg-white/5 text-white/30 ring-1 ring-white/5"
      >
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="hover:bg-primary hover:ring-primary grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5"
    >
      {children}
    </a>
  );
}
