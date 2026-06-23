"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { submitTestimonial } from "@/server/actions/testimonials";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const schema = z.object({
  authorName: z.string().min(2, "Please enter your name"),
  authorRole: z.string().optional(),
  organization: z.string().optional(),
  quote: z.string().min(10, "Tell us a little more"),
  website: z.string().optional(),
});
type Values = z.infer<typeof schema>;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function TestimonialForm() {
  const t = useTranslations("Testimonials");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await submitTestimonial({ ...values, rating, locale });
      if (res.ok) setDone(true);
      else toast.error(res.error);
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <h3 className="text-xl font-semibold">{t("successTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("successBody")}</p>
      </div>
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
        <Field label={t("name")} error={errors.authorName?.message}>
          <Input {...register("authorName")} autoComplete="name" />
        </Field>
        <Field label={t("role")}>
          <Input {...register("authorRole")} placeholder={t("rolePlaceholder")} />
        </Field>
      </div>
      <Field label={t("organization")}>
        <Input {...register("organization")} />
      </Field>
      <Field label={t("quote")} error={errors.quote?.message}>
        <Textarea rows={4} {...register("quote")} />
      </Field>

      <Button type="submit" size="lg" variant="gradient" loading={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("moderationNote")}</p>
    </form>
  );
}
