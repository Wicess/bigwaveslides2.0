"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { submitReview } from "@/server/actions/reviews";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const schema = z.object({
  authorName: z.string().min(2, "Please enter your name"),
  title: z.string().optional(),
  body: z.string().min(10, "Tell us a little more"),
  website: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations("Reviews");
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await submitReview({ ...values, productId, rating });
      if (res.ok) {
        toast.success(t("submitted"));
        reset();
        setRating(5);
        setDone(true);
      } else {
        toast.error(res.error ?? t("error"));
      }
    });
  };

  if (done) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <h3 className="mt-4 text-lg font-bold">{t("submitted")}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("moderationNote")}</p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div>
        <span className="mb-1.5 block text-sm font-medium">{t("yourRating")}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={t("yourRating")}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i}`}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  i <= (hover || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-border text-border",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("name")}</span>
          <Input {...register("authorName")} autoComplete="name" />
          {errors.authorName ? (
            <span className="text-xs text-red-600">{errors.authorName.message}</span>
          ) : null}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("title")}</span>
          <Input {...register("title")} />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("review")}</span>
        <Textarea rows={4} {...register("body")} />
        {errors.body ? (
          <span className="text-xs text-red-600">{errors.body.message}</span>
        ) : null}
      </label>

      <Button type="submit" loading={pending}>
        {pending ? t("sending") : t("submit")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("moderationNote")}</p>
    </form>
  );
}
