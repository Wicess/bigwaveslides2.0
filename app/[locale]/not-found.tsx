/**
 * 404 "Not Found" page.
 *
 * A special App Router file: Next.js renders this whenever a route is missing
 * or when code calls `notFound()` (as page.tsx/layout.tsx do for unsupported
 * locales). It is a Server Component, so it can await translations directly.
 */
import { getTranslations } from "next-intl/server";
// Locale-aware Link from next-intl: keeps the user's current language in the URL.
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  // Translated text for this page ("title", "description", "back" labels).
  const t = await getTranslations("NotFound");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-gradient text-7xl font-bold">404</p>
      <h1 className="mt-4 text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2">{t("description")}</p>
      <Link
        href="/"
        className="bg-primary mt-8 inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
      >
        {t("back")}
      </Link>
    </main>
  );
}
