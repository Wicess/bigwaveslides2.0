import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AccountChat } from "@/components/account/account-chat";

export const metadata: Metadata = {
  title: "Chat with Splash Republic",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

/** The profile's chat tab: the conversation with the team, full screen. */
export default async function AccountChatPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <AccountChat />;
}
