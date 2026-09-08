import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { readUnsubscribeToken } from "@/lib/newsletter-token";
import { unsubscribeNewsletter } from "@/server/actions/newsletter";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string; done?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/unsubscribe",
    title: "Email preferences | Splash Republic",
    description:
      "Unsubscribe from Splash Republic emails. You will still receive booking confirmations and invoices for any order you place.",
    // Not a destination — it exists for one signed link in an email footer, and
    // an indexed opt-out page invites bots to it. Absent from the sitemap too.
    noindex: true,
  });
}

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { t = "", done } = await searchParams;
  const email = t ? await readUnsubscribeToken(t) : null;

  /*
   * The opt-out happens HERE, on submit — never on page load.
   *
   * Mail clients, corporate link scanners and preview bots fetch every URL in a
   * message before a human sees it. If GET unsubscribed, those prefetches would
   * silently opt people out of a list they never chose to leave, and the first
   * anyone would know is when the mail stopped. So the link only ever shows
   * this confirmation, and one click on the button below does the work.
   */
  async function confirm() {
    "use server";
    const res = await unsubscribeNewsletter({ token: t, via: "email-link" });
    // Redirect rather than re-render so a refresh cannot re-submit, and so the
    // token drops out of the URL once it has been used.
    redirect(`/${locale}/unsubscribe?done=${res.ok ? "1" : "0"}`);
  }

  return (
    <main>
      <Section>
        <Container className="max-w-xl py-16">
          {done === "1" ? (
            <>
              <h1 className="text-3xl font-bold sm:text-4xl">
                You&rsquo;re unsubscribed
              </h1>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                We won&rsquo;t send you any more marketing email. You&rsquo;ll
                still get confirmations and invoices for anything you book
                &mdash; those aren&rsquo;t marketing, and you need them.
              </p>
              <p className="text-muted-foreground mt-4 text-sm">
                Changed your mind? Subscribe again from the footer of any page.
              </p>
              <Button asChild className="mt-8">
                <Link href="/">Back to the site</Link>
              </Button>
            </>
          ) : !email ? (
            <>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {done === "0" ? "That didn't work" : "Link not valid"}
              </h1>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                This unsubscribe link is invalid or has expired. Use the link in
                a more recent email, or contact us and we&rsquo;ll take you off
                the list ourselves.
              </p>
              <Button asChild className="mt-8">
                <Link href="/contact">Contact us</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Unsubscribe from our emails?
              </h1>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                This will stop marketing email to{" "}
                <span className="text-foreground font-medium">{email}</span>.
                You&rsquo;ll still receive confirmations and invoices for
                anything you book.
              </p>
              <p className="text-muted-foreground mt-3 text-sm">
                Note: our 15% subscriber discount goes with it.
              </p>
              <form action={confirm} className="mt-8 flex flex-wrap gap-3">
                <Button type="submit" size="lg">
                  Unsubscribe
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/">Keep receiving them</Link>
                </Button>
              </form>
            </>
          )}
        </Container>
      </Section>
    </main>
  );
}
