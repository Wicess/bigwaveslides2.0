"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  Waves,
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/cart/cart-badge";
import { LocaleSwitcher } from "./locale-switcher";
import type { NavData } from "@/server/data/navigation";

type Props = { locale: string; data: NavData };

export function SiteHeader({ locale, data }: Props) {
  const t = useTranslations("Layout");
  const tn = useTranslations("Nav");
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const loc = (v: unknown) => getLocalized(v, locale);

  const simpleLinks = [
    { href: "/events", label: tn("events") },
    { href: "/blog", label: tn("blog") },
    { href: "/about", label: tn("about") },
    { href: "/contact", label: tn("contact") },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "glass shadow-[var(--shadow-soft)]"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold"
        >
          <span className="grid size-9 place-items-center rounded-xl text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]">
            <Waves className="size-5" />
          </span>
          <span>
            Big Wave <span className="text-primary">Slides</span>
          </span>
        </Link>

        {/* Desktop nav */}
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

          {simpleLinks.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-0.5">
          <IconLink href="/shop" label={t("search")}>
            <Search className="size-5" />
          </IconLink>
          <IconLink
            href="/account/wishlist"
            label={t("wishlist")}
            className="hidden sm:grid"
          >
            <Heart className="size-5" />
          </IconLink>
          <IconLink href="/cart" label={t("cart")} className="relative">
            <ShoppingBag className="size-5" />
            <CartBadge />
          </IconLink>
          <IconLink
            href="/account"
            label={t("account")}
            className="hidden sm:grid"
          >
            <User className="size-5" />
          </IconLink>
          <div className="ml-1 hidden lg:block">
            <LocaleSwitcher />
          </div>
          <Button asChild size="sm" className="ml-1 hidden md:inline-flex">
            <Link href="/quote">{t("getQuote")}</Link>
          </Button>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t("openMenu")}
            className="grid size-10 place-items-center rounded-full text-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="size-6" />
          </button>
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
        className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        {label}
        <ChevronDown className="size-3.5 transition-transform duration-300 group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-50 w-[min(42rem,90vw)] -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="glass rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-soft)]">
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
      className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
    >
      {children}
    </Link>
  );
}

function IconLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "grid size-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-primary",
        className,
      )}
    >
      {children}
    </Link>
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
    { label: tn("events"), href: "/events" },
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
              <span className="font-display text-lg font-bold">
                Big Wave <span className="text-primary">Slides</span>
              </span>
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

            <div className="mt-8 flex flex-col gap-4">
              <Button asChild size="lg">
                <Link href="/quote" onClick={onClose}>
                  {t("getQuote")}
                </Link>
              </Button>
              <div className="flex items-center justify-between">
                <LocaleSwitcher />
                <div className="flex gap-1">
                  <IconLink href="/account" label={t("account")}>
                    <User className="size-5" />
                  </IconLink>
                  <IconLink href="/account/wishlist" label={t("wishlist")}>
                    <Heart className="size-5" />
                  </IconLink>
                  <IconLink href="/cart" label={t("cart")}>
                    <ShoppingBag className="size-5" />
                  </IconLink>
                </div>
              </div>
            </div>

            {data.settings.contact?.phone ? (
              <p className="mt-auto pt-6 text-sm text-muted-foreground">
                {data.settings.contact.phone}
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
