/*
 * SiteHeader — the sticky navigation bar shown at the top of every page.
 *
 * What it renders:
 *  - A frosted-glass bar that stays pinned to the top as you scroll (see the
 *    `sticky` class below) containing the logo, the main navigation, and the
 *    action buttons (call, cart, Get Quote, Contact).
 *  - On large screens: hover-to-open "mega menu" dropdowns (Shop / Rent /
 *    Services) plus a small EN/FR language toggle.
 *  - On small screens: a hamburger button that slides in a full mobile menu.
 *
 * "use client" tells Next.js this is a Client Component — it needs to run in
 * the browser because it uses React state (the mobile menu open/close), effects,
 * and animations, none of which work in a server-only component.
 */
"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
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
import { optimizedSrc } from "@/lib/image-loader";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/cart/cart-badge";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { OPEN_CART_EVENT } from "@/lib/cart-event";
import { InstallApp } from "./install-app";
import { AccountChip } from "./account-chip";
import type { NavData } from "@/server/data/navigation";

type Props = { locale: string; data: NavData };

export function SiteHeader({ locale, data }: Props) {
  const t = useTranslations("Layout");
  const tn = useTranslations("Nav");
  // Tracks whether the slide-in mobile menu is open. Starts closed (false).
  const [mobileOpen, setMobileOpen] = React.useState(false);
  // Which desktop mega-menu dropdown is open (by id), or null if none. Keeping a
  // single value guarantees only ONE panel can be open at a time — hovering a
  // new trigger immediately replaces the previous one (no overlapping panels).
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  // Body-scroll lock: while the mobile menu is open we set the page's overflow
  // to "hidden" so the page behind the menu can't scroll. The cleanup function
  // restores normal scrolling when the menu closes or the component unmounts.
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Small helper: picks the right-language string from a localized value.
  const loc = (v: unknown) => getLocalized(v, locale);
  // The call button is driven entirely by Settings → Contact. With no number
  // configured it is hidden rather than dialing a hardcoded fallback; set the
  // phone in the admin panel and it reappears everywhere on the next request.
  const phone = data.settings.contact?.phone?.trim() || null;
  // Build a "tel:" link, stripping everything except digits and a leading "+".
  const telHref = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : null;

  return (
    // `sticky top-0` keeps this header pinned to the top of the viewport as the
    // user scrolls; `z-50` stacks it above normal page content.
    <header className="sticky top-0 z-50 px-3 pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-5 sm:pt-[max(env(safe-area-inset-top),1.75rem)]">
      <div className="mx-auto max-w-[84rem]">
        <div className="flex h-[5.5rem] items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-[rgba(18,19,26,0.45)] px-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-6">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              aria-label="Splash Republic — home"
              className="flex shrink-0 items-center gap-2.5"
            >
              <Image
                src="/logo.png"
                alt=""
                aria-hidden
                width={56}
                height={56}
                priority
                className="h-10 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] sm:h-12"
              />
              {/* Redundant with the logo image (which already reads "Splash Republic
                  Slides") — hidden on narrow phones so the crowded action row
                  never overflows and collides with the logo. */}
              <span
                aria-hidden
                className="font-brand hidden text-[1.65rem] font-bold tracking-[-0.01em] text-white min-[430px]:inline"
              >
                SR
              </span>
            </Link>

            {/* Desktop navigation — hidden on small screens (`hidden ... lg:flex`).
                Each MegaItem is a top-level link that reveals a dropdown panel
                on hover. The panel content is passed in as children below. */}
            <nav
              className="hidden items-center gap-0.5 lg:flex"
              onMouseLeave={() => setOpenMenu(null)}
            >
              <MegaItem
                id="rent"
                label={tn("rent")}
                href="/rent"
                open={openMenu === "rent"}
                onOpen={setOpenMenu}
              >
                <div className="grid grid-cols-[1.4fr_1fr] gap-5">
                  <div>
                    <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
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

              <MegaItem
                id="shop"
                label={tn("shop")}
                href="/shop"
                open={openMenu === "shop"}
                onOpen={setOpenMenu}
              >
                <div className="grid grid-cols-[1.4fr_1fr] gap-5">
                  <div>
                    <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                      {t("megaShopTitle")}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {data.categories.map((c) => (
                        <PanelLink
                          key={c.slug}
                          href={`/shop/category/${c.slug}`}
                        >
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

              <MegaItem
                id="services"
                label={tn("services")}
                href="/services"
                open={openMenu === "services"}
                onOpen={setOpenMenu}
              >
                <div className="grid grid-cols-[1.4fr_1fr] gap-5">
                  <div>
                    <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                      {t("megaServicesTitle")}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {data.services.slice(0, 8).map((s) => (
                        <PanelLink key={s.slug} href={`/services#${s.slug}`}>
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

          {/* Right: action buttons (language toggle, call, cart, quote, contact,
              and the hamburger that opens the mobile menu). */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Desktop: language toggle. Mobile: install-the-app button. */}
            <HeaderLocale />
            <InstallApp variant="chip" />

            {/* Phone link uses `external` so IconChip renders a plain <a> for the
                tel: URL instead of the locale-aware <Link>. Omitted entirely
                when no contact phone is configured. */}
            {telHref ? (
              <IconChip href={telHref} label={t("call")} external>
                <Phone className="size-4 sm:size-[18px]" />
              </IconChip>
            ) : null}

            <AccountChip label={t("account")} />

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))
              }
              aria-label={t("cart")}
              className="relative grid size-9 place-items-center rounded-md border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 sm:size-11"
            >
              <ShoppingBag className="size-4 sm:size-[18px]" />
              <CartBadge />
            </button>

            <Link
              href="/contact"
              className="font-brand hidden h-11 items-center rounded-md bg-white px-5 text-xs font-bold tracking-wider text-neutral-900 uppercase transition-transform hover:-translate-y-0.5 hover:bg-white/90 md:inline-flex"
            >
              {t("getQuote")}
            </Link>

            <Link
              href="/contact"
              className="font-brand hidden h-11 items-center rounded-md bg-[#a3e635] px-5 text-xs font-bold tracking-wider text-neutral-900 uppercase shadow-[0_6px_20px_-8px_rgba(163,230,53,0.85)] transition-transform hover:-translate-y-0.5 hover:bg-[#8fd11f] sm:inline-flex"
            >
              {tn("contact")}
            </Link>

            {/* Hamburger button — only visible below the `lg` breakpoint.
                Clicking it flips `mobileOpen` to true, which opens the drawer. */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("openMenu")}
              className="grid size-9 place-items-center rounded-md border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 sm:size-11 lg:hidden"
            >
              <Menu className="size-[18px] sm:size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* The slide-in drawer for mobile. It controls its own animation but the
          open/close state lives here in the parent. */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        data={data}
      />

      {/* Slide-in cart drawer — opens from the cart button / OPEN_CART event. */}
      <CartDrawer locale={locale} />
    </header>
  );
}

/* ─────────── Desktop helpers ─────────── */

/**
 * MegaItem — one top-level nav entry (e.g. "Shop") with a dropdown "mega menu".
 *
 * The open/closed state is controlled by the parent via `open` + `onOpen`, and
 * the parent only ever keeps ONE menu open. We open this menu on mouse-enter
 * (and on keyboard focus, for accessibility); the parent closes it when the
 * pointer leaves the whole nav. Because only one panel is ever open, dropdowns
 * can never overlap each other — moving from Shop to Rent instantly swaps them.
 *
 * `z-[70]` while open lifts the active panel above any panel that is still
 * fading out, and the panel background is solid white so nothing bleeds through.
 */
function MegaItem({
  id,
  label,
  href,
  open,
  onOpen,
  children,
}: {
  id: string;
  label: string;
  href: string;
  open: boolean;
  onOpen: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => onOpen(id)}
      onFocus={() => onOpen(id)}
    >
      <Link
        href={href}
        className="font-brand inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-[15px] font-medium text-white/85 transition-colors hover:text-white"
      >
        {label}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </Link>
      {/* The dropdown panel. `pt-[2.4rem]` adds an invisible gap above the card
          so the mouse can travel from the link into the panel without it closing. */}
      <div
        className={cn(
          "absolute top-full left-0 w-[min(42rem,90vw)] pt-[2.4rem] transition-all duration-200",
          open
            ? "visible z-[70] translate-y-0 opacity-100"
            : "invisible z-[60] translate-y-1 opacity-0",
        )}
      >
        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-5 shadow-[0_24px_60px_-20px_rgba(0,51,102,0.3)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/** PanelLink — a single text link inside a mega-menu panel (e.g. a category). */
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
      className="text-foreground/80 hover:bg-primary-50 hover:text-primary rounded-lg px-3 py-2 text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}

/**
 * PanelCta — the highlighted "call to action" card on the right side of a mega
 * menu (gradient background, title, description, and an arrow link).
 */
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
      className="group/cta relative flex flex-col justify-between overflow-hidden rounded-[var(--radius)] p-4 text-white"
    >
      {/* Blurred, blueish water photo (from R2) behind the card. A blue
          gradient over it keeps the text crisp while giving a soft, on-brand
          backdrop. The image slowly zooms on hover. aria-hidden: decorative. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedSrc(
          "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/hero/aquaforms.jpg",
          640,
        )}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full scale-110 object-cover blur-[3px] transition-transform duration-700 group-hover/cta:scale-125"
      />
      <div className="absolute inset-0 [background:linear-gradient(150deg,rgba(0,51,102,0.9)_0%,rgba(0,122,204,0.82)_55%,rgba(0,153,255,0.78)_100%)]" />

      <div className="relative">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-white/85">{desc}</p>
      </div>
      <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold">
        {cta}{" "}
        <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** NavLink — a plain top-level nav link with no dropdown (e.g. Blog, About). */
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
      className="font-brand rounded-lg px-3.5 py-2 text-[15px] font-medium text-white/85 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}

/**
 * IconChip — a small square button that holds a single icon (phone, cart).
 * When `external` is true it renders a regular <a> (for links that leave the
 * app, like a tel: link); otherwise it uses the locale-aware <Link>.
 */
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
  // Shared styling for the chip; `className` lets the caller add extras
  // (e.g. `relative` so the cart badge can position over it).
  const cls = cn(
    "grid size-9 place-items-center rounded-md border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 sm:size-11",
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
  const activeLocale = useLocale(); // the language currently in use (e.g. "en")
  const pathname = usePathname(); // current path, so we can re-load it in the new language
  const router = useRouter();
  // useTransition lets the language switch happen without blocking the UI;
  // `isPending` is true while the new-language page is loading, so we can
  // disable the buttons to prevent double-clicks.
  const [isPending, startTransition] = React.useTransition();

  return (
    <div
      className="hidden items-center rounded-md border border-white/15 bg-white/5 p-0.5 md:inline-flex"
      role="group"
      aria-label="Language"
    >
      {/* One button per supported language. Clicking a button reloads the same
          path in that language; `aria-current` marks the active one for a11y. */}
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
              "font-brand rounded-sm px-2.5 py-1.5 text-xs font-bold uppercase transition-colors",
              isActive
                ? "bg-white text-neutral-900"
                : "text-white/70 hover:text-white",
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

/**
 * MobileMenu — the full-screen drawer that slides in from the right on phones.
 *
 * Props:
 *  - `open`    : whether the drawer should be shown (controlled by the header).
 *  - `onClose` : called to close the drawer (tapping the backdrop, the X, or a link).
 *  - `data`    : nav data (phone number, etc.) for the footer area.
 */
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
    { label: tn("rent"), href: "/rent" },
    { label: tn("shop"), href: "/shop" },
    { label: tn("services"), href: "/services" },
    { label: tn("blog"), href: "/blog" },
    { label: tn("about"), href: "/about" },
    { label: tn("contact"), href: "/contact" },
  ];

  const phone = data.settings.contact?.phone;

  return (
    // Always rendered; open/close is a pure CSS transition (no framer-motion),
    // so the header no longer pulls the animation library into every page's
    // bundle — a big main-thread / TBT win site-wide. `inert` when closed keeps
    // the off-screen drawer out of tab order and pointer events.
    <div
      inert={!open}
      className={cn(
        "fixed inset-0 z-[100] overflow-hidden lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Dimmed backdrop behind the panel — tapping it closes the menu. */}
      <button
        aria-label={t("closeMenu")}
        onClick={onClose}
        className={cn(
          "bg-ink/50 absolute inset-0 backdrop-blur-md transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* The drawer panel slides in from the right (translate-x-full → 0). */}
      <div
        className={cn(
          "bg-background absolute top-0 right-0 flex h-dvh w-[84%] max-w-xs flex-col shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pb-4"
          style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
        >
          <Link
            href="/"
            onClick={onClose}
            aria-label="Splash Republic — home"
            className="flex items-center gap-2.5"
          >
            <Image
              src="/logo.png"
              alt=""
              aria-hidden
              width={150}
              height={127}
              className="h-10 w-auto"
            />
            <span
              aria-hidden
              className="font-brand text-foreground text-xl font-bold tracking-[-0.01em]"
            >
              SR
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeMenu")}
            className="text-foreground hover:bg-muted grid size-10 place-items-center rounded-full transition-colors active:scale-95"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Nav — clean text links. Each row animates in one after another:
                the `delay` grows with the index `i`, creating a staggered effect. */}
        <nav className="flex-1 overflow-y-auto px-6">
          {sections.map((s, i) => (
            <div
              key={s.href}
              className={cn(
                "transition-all duration-300 ease-out",
                open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
              )}
              style={{ transitionDelay: open ? `${60 + i * 45}ms` : "0ms" }}
            >
              <Link
                href={s.href}
                onClick={onClose}
                className="group border-border text-foreground hover:text-primary flex items-center justify-between border-b py-4 text-lg font-semibold transition-colors"
              >
                {s.label}
                <ArrowRight className="text-muted-foreground/50 group-hover:text-primary size-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </div>
          ))}
        </nav>

        {/* Footer actions — primary buttons, phone, language, and cart.
                The inline `paddingBottom` respects the phone's bottom safe area
                (e.g. the iPhone home-bar) so controls aren't hidden behind it. */}
        <div
          className="border-border border-t px-6 pt-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}
        >
          <div className="flex flex-col gap-2.5">
            <Button asChild variant="gradient" size="lg">
              <Link href="/contact" onClick={onClose}>
                {t("getQuote")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact" onClick={onClose}>
                {tn("contact")}
              </Link>
            </Button>
          </div>

          {phone ? (
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="text-muted-foreground hover:text-primary mt-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Phone className="size-4" /> {phone}
            </a>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            <InstallApp variant="drawer" />
            <button
              type="button"
              aria-label={t("cart")}
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT));
              }}
              className="border-border text-foreground hover:bg-muted hover:text-primary relative grid size-10 place-items-center rounded-xl border transition-colors"
            >
              <ShoppingBag className="size-5" />
              <CartBadge />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
