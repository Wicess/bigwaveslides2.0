"use client";

/*
 * ExploreBar — a sticky, phone-only bottom bar with one-tap ways deeper into
 * the site (your city / slides / free quote). Built to fight single-page
 * sessions: 60% of mobile visitors leave from their landing page because every
 * "explore more" link sits far below the fold. This keeps a way forward always
 * in reach.
 *
 * Behaviour:
 *  - Phones only (`sm:hidden`); desktop has the full header nav.
 *  - Appears after a little scroll (so it never blocks the hero on arrival).
 *  - Hides itself when the footer scrolls into view (the footer already has
 *    full navigation + CTAs, so the bar would be redundant there).
 *  - Hidden on the conversion flows (cart / checkout / order / account) so it
 *    never distracts a buyer mid-payment.
 *  - Publishes its height to `--explore-bar-h` so the WhatsApp button and the
 *    back-to-top button lift above it instead of colliding.
 */

import * as React from "react";
import { MapPin, Waves, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const BAR_VAR = "--explore-bar-h";
const HIDDEN_PREFIXES = ["/order", "/checkout", "/cart", "/account"];

export function ExploreBar() {
  const t = useTranslations("Layout");
  const pathname = usePathname(); // locale-stripped path, e.g. "/blog/x"
  const [shown, setShown] = React.useState(false);
  const [footerVisible, setFooterVisible] = React.useState(false);

  const excluded = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Reveal after a small scroll; also re-evaluate on resize.
  React.useEffect(() => {
    if (excluded) return;
    const onScroll = () => setShown(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [excluded]);

  // Hide once the footer is on screen.
  React.useEffect(() => {
    if (excluded) return;
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(
      ([e]) => setFooterVisible(Boolean(e?.isIntersecting)),
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, [excluded]);

  const visible = shown && !footerVisible && !excluded;

  // Publish height so the floating buttons can lift above the bar.
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(BAR_VAR, visible ? "5.5rem" : "0px");
    return () => root.style.setProperty(BAR_VAR, "0px");
  }, [visible]);

  if (excluded) return null;

  const items = [
    { href: "/water-slide-rentals", label: t("exploreCity"), icon: MapPin },
    { href: "/rent", label: t("exploreSlides"), icon: Waves },
  ] as const;

  return (
    <div
      aria-hidden={!visible}
      className={[
        "fixed inset-x-0 bottom-0 z-40 sm:hidden",
        "px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0" : "pointer-events-none translate-y-[130%]",
      ].join(" ")}
    >
      <nav
        aria-label={t("exploreNav")}
        className="border-border/70 bg-background/85 flex items-stretch gap-1.5 rounded-2xl border p-1.5 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            tabIndex={visible ? 0 : -1}
            className="text-foreground/80 hover:text-primary flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors active:scale-[0.97]"
          >
            <Icon className="text-primary size-[18px]" />
            {label}
          </Link>
        ))}
        <Link
          href="/contact"
          tabIndex={visible ? 0 : -1}
          className="flex flex-[1.3] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-bold text-white [background:var(--gradient-wave)] active:scale-[0.98]"
        >
          <Sparkles className="size-4" />
          {t("exploreQuote")}
        </Link>
      </nav>
    </div>
  );
}
