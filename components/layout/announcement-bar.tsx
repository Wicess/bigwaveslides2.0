import { getTranslations } from "next-intl/server";

/**
 * Slim utility bar pinned to the very top. The white background extends up into
 * the device safe-area (under the status bar / notch) so the app reads as
 * edge-to-edge and premium on mobile.
 */
export async function AnnouncementBar() {
  const t = await getTranslations("Layout");

  return (
    <div
      className="relative z-50 bg-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <p className="border-b border-border px-4 py-2 text-center text-[11px] font-medium tracking-wide text-foreground sm:text-xs">
        {t("announce")}
      </p>
    </div>
  );
}
