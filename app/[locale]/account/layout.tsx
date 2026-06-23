import type { ReactNode } from "react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PageHeader } from "@/components/ui/page-header";
import { AccountNav } from "@/components/account/account-nav";
import { WishlistSync } from "@/components/account/wishlist-sync";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export default async function AccountLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const t = await getTranslations("Account");

  return (
    <main>
      <WishlistSync />
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("greeting", { name: session.user.name ?? "" })}
        description={t("subtitle")}
      />
      <Section spacing="compact" className="pb-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <AccountNav />
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
