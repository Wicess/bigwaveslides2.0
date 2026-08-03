import {
  Star,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  MapPin,
  Building2,
  ExternalLink,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getRatingSummary } from "@/server/data/home";
import { getApprovedTestimonials } from "@/server/data/testimonials";
import { getSettings } from "@/server/data/settings";
import { getLocalized } from "@/lib/localized";

/**
 * Trust layer for the payment page. Manual rails (Zelle/Cash App/…) ask a
 * stranger to send money to a handle — which pattern-matches to a scam. This
 * closes that gap at the exact moment of paying, with only REAL, verifiable
 * signals: the live review aggregate, approved testimonials, the actual
 * business NAP, and a plain-language protection + official-account guarantee.
 */
export async function PaymentTrust({ locale }: { locale: string }) {
  const t = await getTranslations("OrderFlow");
  const [rating, testimonialsRaw, settings] = await Promise.all([
    getRatingSummary().catch(() => ({ count: 0, value: 0 })),
    getApprovedTestimonials().catch(() => []),
    getSettings().catch(() => ({}) as Awaited<ReturnType<typeof getSettings>>),
  ]);

  const testimonials = testimonialsRaw
    .filter((x) => x.quote && x.authorName)
    .slice(0, 2);

  const c = settings?.contact ?? {};
  // Only surface an address when a real STREET has been set in admin — city/
  // state alone isn't the legitimacy signal we want to imply.
  const addressLine = c.streetAddress?.trim() ? c.address || "" : "";
  // Turn the rating into external, checkable proof only when the owner has set
  // a public reviews profile (Google/Trustpilot) in admin.
  const reviewsUrl = settings?.social?.reviewsUrl?.trim() || "";

  const protect = [t("protect1"), t("protect2"), t("protect3"), t("protect4")];
  const official = [t("official1"), t("official2"), t("official3")];

  return (
    <section className="border-border mt-5 overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-slate-950">
      {/* Confidence bar — real, verifiable facts, first. */}
      <div className="border-border/70 bg-muted/40 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-b px-6 py-4 text-center">
        {rating.count > 0
          ? (() => {
              const inner = (
                <>
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </span>
                  <span className="text-foreground text-sm font-bold">
                    {rating.value.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {t("trustReviews", { count: rating.count })}
                  </span>
                  {reviewsUrl ? (
                    <ExternalLink className="text-muted-foreground size-3.5" />
                  ) : null}
                </>
              );
              return reviewsUrl ? (
                <a
                  href={reviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:text-primary inline-flex items-center gap-2 underline-offset-4 hover:underline"
                >
                  {inner}
                </a>
              ) : (
                <span className="inline-flex items-center gap-2">{inner}</span>
              );
            })()
          : null}
        <span className="text-foreground/85 inline-flex items-center gap-2 text-sm font-semibold">
          <BadgeCheck className="text-primary size-4" />
          {t("trustEvents")}
        </span>
        <span className="text-foreground/85 inline-flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="text-primary size-4" />
          {t("trustInsuredLicensed")}
        </span>
      </div>

      <div className="p-6 sm:p-7">
        {/* Protection + official account — the two decisive reassurances, side
            by side on desktop so neither reads as filler. */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div>
            <h2 className="font-display flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="size-5 text-emerald-600" />
              {t("protectTitle")}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {protect.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span className="text-foreground/80 text-sm leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-border/70 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <h2 className="font-display flex items-center gap-2 text-base font-bold">
              <BadgeCheck className="text-primary size-5" />
              {t("officialTitle")}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {official.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                  <span className="text-foreground/80 text-sm leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Real testimonials — people who already paid and were glad they did. */}
        {testimonials.length > 0 ? (
          <div className="border-border/70 mt-6 border-t pt-6">
            <p className="text-muted-foreground text-[11px] font-bold tracking-[0.14em] uppercase">
              {t("reviewsHeading")}
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {testimonials.map((tm) => (
                <figure key={tm.id} className="bg-muted/40 rounded-2xl p-4">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: Math.round(tm.rating ?? 5) }).map(
                      (_, i) => (
                        <Star key={i} className="size-3.5 fill-current" />
                      ),
                    )}
                  </div>
                  <blockquote className="text-foreground/80 mt-2 text-sm leading-relaxed">
                    “{getLocalized(tm.quote, locale)}”
                  </blockquote>
                  <figcaption className="text-foreground mt-2 text-xs font-semibold">
                    {getLocalized(tm.authorName, locale)}
                    {tm.organization ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {getLocalized(tm.organization, locale)}
                      </span>
                    ) : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null}

        {/* Real business identity — a registered, reachable US company. */}
        <div className="border-border/70 mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t pt-5 text-xs">
          <span className="text-foreground inline-flex items-center gap-1.5 font-semibold">
            <Building2 className="text-primary size-3.5" />
            Big Wave Slides
          </span>
          {addressLine ? (
            <span className="text-muted-foreground inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {addressLine}
            </span>
          ) : null}
          <span className="text-muted-foreground">{t("businessNote")}</span>
        </div>
      </div>
    </section>
  );
}
