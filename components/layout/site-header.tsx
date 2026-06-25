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
  Waves,
  Wrench,
  Newspaper,
  Info,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Clock,
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
        <div className="flex h-[5.5rem] items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-[rgba(18,19,26,0.45)] px-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-6">
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
    { label: tn("shop"), href: "/shop", icon: ShoppingBag, desc: t("megaShopTitle") },
    { label: tn("rent"), href: "/rent", icon: Waves, desc: t("megaRentTitle") },
    { label: tn("services"), href: "/services", icon: Wrench, desc: t("megaServicesTitle") },
    { label: tn("blog"), href: "/blog", icon: Newspaper },
    { label: tn("about"), href: "/about", icon: Info },
    { label: tn("contact"), href: "/contact", icon: MessageCircle },
  ];

  const trust = [
    { icon: ShieldCheck, label: t("insured") },
    { icon: Sparkles, label: t("clean") },
    { icon: Clock, label: t("onTime") },
  ];

  const phone = data.settings.contact?.phone;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] lg:hidden"
        >
          <button
            aria-label={t("closeMenu")}
            onClick={onClose}
            className="absolute inset-0 bg-ink/50 backdrop-blur-md"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38, mass: 0.9 }}
            className="absolute right-0 top-0 flex h-dvh w-[88%] max-w-sm flex-col overflow-hidden bg-background shadow-2xl"
          >
            {/* Branded header */}
            <div
              className="relative overflow-hidden px-6 pb-6 text-white [background:var(--gradient-deep)]"
              style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
            >
              {/* soft wave glow */}
              <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <Link
                  href="/"
                  onClick={onClose}
                  aria-label="Big Wave Slides — home"
                  className="flex items-center gap-3"
                >
                  <Image
                    src="/logo.png"
                    alt="Big Wave Slides"
                    width={150}
                    height={127}
                    className="h-12 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                  />
                  <span className="font-brand text-2xl font-bold tracking-[-0.01em]">
                    Big Wave Slides
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("closeMenu")}
                  className="-mr-1 grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="relative mt-4 max-w-[18rem] text-sm leading-relaxed text-white/80">
                {t("footerTagline")}
              </p>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-4 py-3">
              {sections.map((s, i) => (
                <motion.div
                  key={s.href}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
                >
                  <Link
                    href={s.href}
                    onClick={onClose}
                    className="group flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-primary-50 active:bg-primary-50"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <s.icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-foreground group-hover:text-primary">
                        {s.label}
                      </span>
                      {s.desc ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {s.desc}
                        </span>
                      ) : null}
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                </motion.div>
              ))}

              {/* Trust chips */}
              <div className="mt-4 flex flex-wrap gap-2 px-1">
                {trust.map((b) => (
                  <span
                    key={b.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
                  >
                    <b.icon className="size-3.5 text-primary" />
                    {b.label}
                  </span>
                ))}
              </div>
            </nav>

            {/* Footer actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              className="border-t border-border px-5 pt-4"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}
            >
              <div className="flex flex-col gap-2.5">
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
              </div>

              {phone ? (
                <a
                  href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Phone className="size-4" /> {phone}
                </a>
              ) : null}

              <div className="mt-4 flex items-center justify-between">
                <LocaleSwitcher />
                <Link
                  href="/cart"
                  aria-label={t("cart")}
                  onClick={onClose}
                  className="relative grid size-10 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  <ShoppingBag className="size-5" />
                  <CartBadge />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
