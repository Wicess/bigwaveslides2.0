import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Auth" });
  return { title: t("forgotTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Auth");

  return (
    <main>
      <Section className="pt-28 sm:pt-32">
        <Container className="max-w-md">
          <Card className="p-8">
            <h1 className="text-2xl font-bold">{t("forgotTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("forgotSubtitle")}</p>
            <div className="mt-6">
              <ForgotPasswordForm />
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/sign-in" className="font-semibold text-primary hover:underline">
                {t("backToSignIn")}
              </Link>
            </p>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
