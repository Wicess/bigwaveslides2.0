"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getLocalized } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/cart/cart-badge";
import { LocaleSwitcher } from "./locale-switcher";
import type { NavData } from "@/server/data/navigation";

type Props = { locale: string; data: NavData };

const FALLBACK_PHONE = "+16143025899";

export function SiteHeader({ locale, data }: Props) {
  const t = useTranslations("Layout");
  const tn = useTranslations("Nav");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const loc = (v: unknown) => getLocalized(v, locale);
  const phone = data.settings.contact?.phone ?? FALLBACK_PHONE;
  const telHref = `tel:${phone.replace(/[^+\d]/g, "")}`;

  return (
    <header className="sticky top-0 z-50 px-3 pt-5 sm:px-5 sm:pt-7">
      <div className="mx-auto max-w-[84rem]">
        <div className="flex h-[5.5rem] items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-[rgba(18,19,26,0.85)] px-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-6">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              aria-label="Big Wave Slides — home"
              className="flex items-center gap-2.5"
            >
              <Image
                src="/logo.png"
                alt="Big Wave Slides"
                width={56}
                height={56}
                priority
                className="h-12 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
              />
              <span className="font-brand text-[1.65rem] font-bold tracking-[-0.01em] text-white">
                BWS
              </span>
            </Link>

            <nav className="hidden items-center gap-0.5 lg:flex">
              <MegaItem label={tn("shop")} href="/shop">
                <div className="grid grid-cols-[1.4fr_1fr] gap-5">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("megaShopTitle")}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {data.categories.map((c) => (
                        <PanelLink key={c.slug} href={`/shop/category/${c.slug}`}>
                          {loc(c.name)}
                        </PanelLink>
                      ))}
                    </div>
                  </div>
                  <PanelCta
                    href="/shop"
                    title={t("megaShopTitle")}
                    desc={t("megaShopDesc")}
                    cta={t("viewAll")}
                  />
                </div>
              </MegaItem>

              <MegaItem label={tn("rent")} href="/rent">
                <div className="grid grid-cols-[1.4fr_1fr] gap-5">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("popularRentals")}
                    </p>
                    <div className="grid gap-1">
                      {data.rentals.map((r) => (
                        <PanelLink key={r.slug} href={`/rent/${r.slug}`}>
                          {loc(r.name)}
                        </PanelLink>
                      ))}
                    </div>
                  </div>
                  <PanelCta
                    href="/rent"
                    title={t("megaRentTitle")}
                    desc={t("megaRentDesc")}
                    cta={t("checkAvailability")}
                  />
                </div>
              </MegaItem>

              <MegaItem label={tn("services")} href="/services">
                <div className="grid grid-cols-[1.4fr_1fr] gap-5">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("megaServicesTitle")}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {data.services.slice(0, 8).map((s) => (
                        <PanelLink key={s.slug} href={`/services/${s.slug}`}>
                          {loc(s.title)}
                        </PanelLink>
                      ))}
                    </div>
                  </div>
                  <PanelCta
                    href="/services"
                    title={t("megaServicesTitle")}
                    desc={t("megaServicesDesc")}
                    cta={t("allServices")}
                  />
                </div>
              </MegaItem>

              <NavLink href="/blog">{tn("blog")}</NavLink>
              <NavLink href="/about">{tn("about")}</NavLink>
            </nav>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <HeaderLocale />

            <IconChip href={telHref} label={t("call")} external>
              <Phone className="size-[18px]" />
            </IconChip>

            <IconChip href="/cart" label={t("cart")} className="relative">
              <ShoppingBag className="size-[18px]" />
              <CartBadge />
            </IconChip>

            <Link
              href="/quote"
              className="hidden h-11 items-center rounded-md bg-white px-5 font-brand text-xs font-bold uppercase tracking-wider text-neutral-900 transition-transform hover:-translate-y-0.5 hover:bg-white/90 md:inline-flex"
            >
              {t("getQuote")}
            </Link>

            <Link
              href="/contact"
              className="hidden h-11 items-center rounded-md bg-[#a3e635] px-5 font-brand text-xs font-bold uppercase tracking-wider text-neutral-900 shadow-[0_6px_20px_-8px_rgba(163,230,53,0.85)] transition-transform hover:-translate-y-0.5 hover:bg-[#8fd11f] sm:inline-flex"
            >
              {tn("contact")}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("openMenu")}
              className="grid size-11 place-items-center rounded-md border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        data={data}
      />
    </header>
  );
}

/* ─────────── Desktop helpers ─────────── */

function MegaItem({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 font-brand text-[15px] font-medium text-white/85 transition-colors hover:text-white"
      >
        {label}
        <ChevronDown className="size-3.5 transition-transform duration-300 group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-0 top-full z-[60] w-[min(42rem,90vw)] translate-y-1 pt-[2.4rem] opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white/80 p-5 shadow-[0_24px_60px_-20px_rgba(0,51,102,0.3)] backdrop-blur-2xl backdrop-saturate-150">
          {children}
        </div>
      </div>
    </div>
  );
}

function PanelLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary-50 hover:text-primary"
    >
      {children}
    </Link>
  );
}

function PanelCta({
  href,
  title,
  desc,
  cta,
}: {
  href: string;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-[var(--radius)] p-4 text-white [background:var(--gradient-deep)]"
    >
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-white/80">{desc}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
        {cta} <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3.5 py-2 font-brand text-[15px] font-medium text-white/85 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}

function IconChip({
  href,
  label,
  children,
  className,
  external,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const cls = cn(
    "grid size-11 place-items-center rounded-md border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10",
    className,
  );
  if (external) {
    return (
      <a href={href} aria-label={label} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cls}>
      {children}
    </Link>
  );
}

/** Compact EN/FR toggle styled for the dark frosted bar (desktop only). */
function HeaderLocale() {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  return (
    <div
      className="hidden items-center rounded-md border border-white/15 bg-white/5 p-0.5 md:inline-flex"
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((l) => {
        const isActive = l === activeLocale;
        return (
          <button
            key={l}
            type="button"
            disabled={isPending}
            aria-current={isActive ? "true" : undefined}
            onClick={() =>
              startTransition(() => router.replace(pathname, { locale: l }))
            }
            className={cn(
              "rounded-sm px-2.5 py-1.5 font-brand text-xs font-bold uppercase transition-colors",
              isActive ? "bg-white text-neutral-900" : "text-white/70 hover:text-white",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────── Mobile menu ─────────── */

function MobileMenu({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: NavData;
}) {
  const t = useTranslations("Layout");
  const tn = useTranslations("Nav");

  const sections = [
    { label: tn("shop"), href: "/shop" },
    { label: tn("rent"), href: "/rent" },
    { label: tn("services"), href: "/services" },
    { label: tn("blog"), href: "/blog" },
    { label: tn("about"), href: "/about" },
    { label: tn("contact"), href: "/contact" },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] lg:hidden"
        >
          <button
            aria-label={t("closeMenu")}
            onClick={onClose}
            className="absolute inset-0 bg-accent/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
            className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto bg-background p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <Image
                src="/logo.png"
                alt="Big Wave Slides"
                width={150}
                height={127}
                className="h-11 w-auto"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeMenu")}
                className="grid size-10 place-items-center rounded-full hover:bg-muted"
              >
                <X className="size-6" />
              </button>
            </div>

            <nav className="mt-8 flex flex-col">
              {sections.map((s, i) => (
                <motion.div
                  key={s.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={s.href}
                    onClick={onClose}
                    className="flex items-center justify-between border-b border-border py-4 text-lg font-semibold transition-colors hover:text-primary"
                  >
                    {s.label}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="mt-8 flex flex-col gap-3">
              <Button asChild size="lg" className="bg-[#a3e635] text-neutral-900 hover:bg-[#8fd11f]">
                <Link href="/contact" onClick={onClose}>
                  {tn("contact")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/quote" onClick={onClose}>
                  {t("getQuote")}
                </Link>
              </Button>
              <div className="flex items-center justify-between">
                <LocaleSwitcher />
                <Link
                  href="/cart"
                  aria-label={t("cart")}
                  onClick={onClose}
                  className="grid size-10 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  <ShoppingBag className="size-5" />
                </Link>
              </div>
            </div>

            {data.settings.contact?.phone ? (
              <a
                href={`tel:${data.settings.contact.phone.replace(/[^+\d]/g, "")}`}
                className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                <Phone className="size-4" /> {data.settings.contact.phone}
              </a>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
