import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/auth-forms";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Auth" });
  return { title: t("signIn"), robots: { index: false } };
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user) redirect("/account");

  const t = await getTranslations("Auth");

  return (
    <main>
      <Section className="pt-28 sm:pt-32">
        <Container className="max-w-md">
          <Card className="p-8">
            <h1 className="text-2xl font-bold">{t("signInTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("signInSubtitle")}</p>
            <div className="mt-6">
              <SignInForm />
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/sign-up" className="font-semibold text-primary hover:underline">
                {t("createAccount")}
              </Link>
            </p>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
