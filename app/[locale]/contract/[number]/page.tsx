import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  FileSignature,
  CheckCircle2,
  ShieldCheck,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import { getContractByNumber } from "@/server/data/contracts";
import { formatPrice, formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { SignContract } from "@/components/rent/sign-contract";
import { PrintButton } from "@/components/rent/print-button";

type Props = { params: Promise<{ locale: string; number: string }> };

export const metadata: Metadata = { robots: { index: false } };

export default async function ContractPage({ params }: Props) {
  const { locale, number } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const contract = await getContractByNumber(number);
  if (!contract) notFound();

  const t = await getTranslations("Contract");
  const b = contract.booking;
  const address =
    (b.eventAddress as { address?: string; city?: string } | null) ?? {};
  const isSigned = contract.status === "SIGNED";
  const isVoid = contract.status === "VOID";

  const terms = [
    t("term1"),
    t("term2"),
    t("term3"),
    t("term4"),
    t("term5"),
    t("term6"),
  ];

  const feeRows = [
    { label: t("rentalSubtotal"), cents: b.subtotalCents },
    { label: t("deliveryFee"), cents: b.deliveryFeeCents },
    { label: t("pickupFee"), cents: b.pickupFeeCents },
  ].filter((r) => r.cents > 0);

  return (
    <main>
      <Section className="pt-28 sm:pt-32">
        <Container className="max-w-3xl">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-primary inline-flex items-center gap-2 text-sm font-semibold tracking-[0.18em] uppercase">
                <FileSignature className="size-4" />
                {t("eyebrow")}
              </span>
              <h1 className="mt-2 text-3xl font-bold">{t("title")}</h1>
              <p className="text-muted-foreground mt-1 font-mono text-sm">
                {contract.contractNumber}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSigned ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="size-4" /> {t("statusSigned")}
                </span>
              ) : isVoid ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                  {t("statusVoid")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                  {t("statusAwaiting")}
                </span>
              )}
              <PrintButton />
            </div>
          </div>

          {/* Summary */}
          <Card className="mt-6 p-6">
            <h2 className="text-lg font-semibold">{t("agreementSummary")}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                  {t("booking")}
                </dt>
                <dd className="font-mono text-sm">{b.bookingNumber}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                  {t("renter")}
                </dt>
                <dd className="text-sm">{b.guestName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wide uppercase">
                  <CalendarDays className="size-3.5" /> {t("eventDates")}
                </dt>
                <dd className="text-sm">
                  {formatDate(b.eventStartDate, locale)} –
                  {formatDate(b.eventEndDate, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wide uppercase">
                  <MapPin className="size-3.5" /> {t("location")}
                </dt>
                <dd className="text-sm">
                  {[address.address, address.city].filter(Boolean).join(", ") ||
                    "—"}
                </dd>
              </div>
            </dl>

            {/* Equipment */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold">{t("equipment")}</h3>
              <ul className="divide-border mt-2 divide-y text-sm">
                {b.items.map((item) => (
                  <li key={item.id} className="flex justify-between py-2">
                    <span>
                      {item.name}{" "}
                      <span className="text-muted-foreground">
                        × {t("days", { count: item.days })}
                      </span>
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.lineTotalCents, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fees */}
            <dl className="border-border mt-4 space-y-1.5 border-t pt-4 text-sm">
              {feeRows.map((r) => (
                <div key={r.label} className="flex justify-between">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="font-medium">
                    {formatPrice(r.cents, locale)}
                  </dd>
                </div>
              ))}
              {b.depositCents > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t("refundableDeposit")}
                  </dt>
                  <dd className="font-medium">
                    {formatPrice(b.depositCents, locale)}
                  </dd>
                </div>
              ) : null}
              <div className="border-border flex justify-between border-t pt-2">
                <dt className="font-semibold">{t("total")}</dt>
                <dd className="font-display text-primary text-lg font-bold">
                  {formatPrice(b.totalCents, locale)}
                </dd>
              </div>
            </dl>
            <p className="text-muted-foreground mt-2 text-xs">
              {t("paymentNote")}
            </p>
          </Card>

          {/* Terms */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold">{t("termsTitle")}</h2>
            <ol className="text-muted-foreground mt-3 space-y-3 text-sm">
              {terms.map((term, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-foreground font-semibold">
                    {i + 1}.
                  </span>
                  <span>{term}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Signature */}
          <Card className="mt-6 p-6">
            {isSigned ? (
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-6 text-green-600" />
                <div>
                  <p className="font-semibold">
                    {t("signedBy", { name: contract.signerName ?? "" })}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {contract.signedAt
                      ? formatDate(contract.signedAt, locale, {
                          dateStyle: "long",
                          timeStyle: "short",
                        } as Intl.DateTimeFormatOptions)
                      : ""}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {t("signedNote")}
                  </p>
                </div>
              </div>
            ) : isVoid ? (
              <p className="text-muted-foreground text-sm">{t("voidNote")}</p>
            ) : (
              <>
                <h2 className="text-lg font-semibold">{t("signTitle")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("signIntro")}
                </p>
                <div className="mt-4">
                  <SignContract
                    contractNumber={contract.contractNumber}
                    expectedName={b.guestName ?? undefined}
                  />
                </div>
              </>
            )}
          </Card>
        </Container>
      </Section>
    </main>
  );
}
