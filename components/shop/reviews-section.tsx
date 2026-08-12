import { getTranslations } from "next-intl/server";
import { getApprovedReviews } from "@/server/data/products";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/ui/stars";
import { Card } from "@/components/ui/card";
import { ReviewForm } from "@/components/shop/review-form";

export async function ReviewsSection({
  productId,
  ratingAvg,
  ratingCount,
  locale,
}: {
  productId: string;
  ratingAvg: number;
  ratingCount: number;
  locale: string;
}) {
  const t = await getTranslations("Reviews");
  const reviews = await getApprovedReviews(productId);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
      {/* Summary + list */}
      <div>
        {/* Score summary appears only when there are approved reviews behind
            it. With none, the list below already says "be the first" — showing
            "0.0" under five empty stars just reads as a bad product. */}
        {ratingCount > 0 ? (
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold">{ratingAvg.toFixed(1)}</span>
            <div>
              <Stars rating={ratingAvg} />
              <p className="text-muted-foreground mt-1 text-sm">
                {t("basedOn", { count: ratingCount })}
              </p>
            </div>
          </div>
        ) : null}

        <ul className="mt-6 space-y-4">
          {reviews.length === 0 ? (
            <li className="text-muted-foreground text-sm">{t("beFirst")}</li>
          ) : (
            reviews.map((r) => (
              <li
                key={r.id}
                className="border-border border-b pb-4 last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{r.authorName}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(r.createdAt, locale)}
                  </span>
                </div>
                <Stars rating={r.rating} size="size-3.5" className="mt-1" />
                {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
                <p className="text-muted-foreground mt-1 text-sm">{r.body}</p>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Submit */}
      <Card className="h-fit p-6">
        <h3 className="text-lg font-semibold">{t("writeTitle")}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("writeSubtitle")}
        </p>
        <div className="mt-4">
          <ReviewForm productId={productId} />
        </div>
      </Card>
    </div>
  );
}
