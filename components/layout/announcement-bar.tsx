import { getTranslations } from "next-intl/server";

/**
 * Slim utility bar pinned to the very top. The white background extends up into
 * the device safe-area (under the status bar / notch) so the app reads as
 * edge-to-edge and premium on mobile.
 *
 * On phones the promo copy is hidden and the bar collapses to a tiny white
 * line that cleanly separates the device status area from the hero. From `sm`
 * up the full announcement text is shown. The bar is sticky so the white line
 * stays pinned at the very top as the page scrolls.
 */
export async function AnnouncementBar() {
  const t = await getTranslations("Layout");

  return (
    <div
      className="sticky top-0 z-40 bg-white sm:relative"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Mobile: just a tiny white separator line */}
      <div className="h-2 border-b border-border sm:hidden" />
      {/* sm+: full announcement copy */}
      <p className="hidden border-b border-border px-4 py-2 text-center text-[11px] font-medium tracking-wide text-foreground sm:block sm:text-xs">
        {t("announce")}
      </p>
    </div>
  );
}
