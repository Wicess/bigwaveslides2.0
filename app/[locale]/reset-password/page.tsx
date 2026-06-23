import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Auth" });
  return { title: t("resetTitle"), robots: { index: false } };
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Auth");
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] : sp.token;

  return (
    <main>
      <Section className="pt-28 sm:pt-32">
        <Container className="max-w-md">
          <Card className="p-8">
            <h1 className="text-2xl font-bold">{t("resetTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("resetSubtitle")}</p>
            <div className="mt-6">
              {token ? (
                <ResetPasswordForm token={token} />
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("resetNoToken")}</p>
                  <Link
                    href="/forgot-password"
                    className="inline-block font-semibold text-primary hover:underline"
                  >
                    {t("requestNewLink")}
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
