import { getTranslations } from "next-intl/server";

/**
 * AnnouncementBar
 * ---------------
 * The thin bar that sits at the very top of EVERY page (it is part of the
 * shared layout, not just the homepage). On wide screens it shows a short
 * promo/announcement message; on phones it shrinks to a plain white line.
 *
 * The white background extends up into the device "safe area" (the space under
 * the status bar / camera notch) so the design feels edge-to-edge and premium
 * on mobile.
 *
 * Why a tiny line on phones? Full promo text would crowd the small screen and
 * push the hero down, so we hide the words and keep just a clean white strip
 * that visually separates the phone's status bar from the page content. From
 * the `sm` breakpoint up there is room, so we show the full text instead.
 *
 * The bar is "sticky" (sticky top-0), meaning it stays glued to the top of the
 * viewport as you scroll instead of scrolling away with the rest of the page.
 */
export async function AnnouncementBar() {
  // Load translated UI strings for the "Layout" namespace (supports multiple
  // languages). t("announce") returns the announcement text for the current
  // locale.
  const t = await getTranslations("Layout");

  return (
    // sticky top-0 pins it to the top while scrolling; z-40 keeps it above most
    // other content. On phones it stays sticky; from `sm` up it becomes a normal
    // (relative) element. The inline paddingTop uses env(safe-area-inset-top),
    // a value the browser fills in equal to the notch/status-bar height, so the
    // white background reaches all the way up under the notch on modern phones.
    <div
      className="sticky top-0 z-40 bg-white sm:relative"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Mobile only: a short white separator line. `sm:hidden` removes it on
          larger screens, where we show the text version below instead. */}
      <div className="h-2 border-b border-border sm:hidden" />
      {/* sm and up only: the full announcement copy. `hidden ... sm:block`
          means it is hidden on phones and revealed from the `sm` breakpoint. */}
      <p className="hidden border-b border-border px-4 py-2 text-center text-[11px] font-medium tracking-wide text-foreground sm:block sm:text-xs">
        {t("announce")}
      </p>
    </div>
  );
}
