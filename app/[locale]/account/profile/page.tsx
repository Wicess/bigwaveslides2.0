import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getCustomerByEmail } from "@/server/data/account";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/profile-form";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountProfilePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const t = await getTranslations("Account");
  const customer = await getCustomerByEmail(session.user.email);
  if (!customer) redirect("/sign-in");

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">{t("nav_profile")}</h1>
      <Card className="max-w-xl p-6">
        <ProfileForm
          email={customer.email}
          defaults={{
            name: customer.name,
            phone: customer.phone ?? "",
            organizationName: customer.organizationName ?? "",
            marketingOptIn: customer.marketingOptIn,
          }}
        />
      </Card>
    </div>
  );
}
