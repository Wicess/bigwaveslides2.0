"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createQuoteRequest } from "@/server/actions/quotes";
import { trackEvent } from "@/lib/analytics/client";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  eventDate: z.string().optional(),
  message: z.string().min(5, "Tell us about your event"),
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

export function QuoteForm({
  context = "GENERAL",
  productId,
  productLabel,
}: {
  context?: "SHOP" | "RENTAL" | "SERVICE" | "GENERAL";
  productId?: string;
  productLabel?: string;
}) {
  const t = useTranslations("Quote");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [quoteRef, setQuoteRef] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: productLabel ? t("prefill", { product: productLabel }) : "",
    },
  });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await createQuoteRequest({
        ...values,
        locale,
        context,
        productId,
        productLabel,
      });
      if (res.ok) {
        trackEvent({ type: "QUOTE_REQUEST", meta: { quoteNumber: res.quoteNumber } });
        setQuoteRef(res.quoteNumber);
      } else toast.error(res.error);
    });
  };

  if (quoteRef) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">{t("successTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("successBody")}</p>
        <p className="mt-4 inline-block rounded-full bg-muted px-4 py-2 font-mono text-sm font-semibold">
          {t("ref")}: {quoteRef}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      {productLabel ? (
        <p className="mb-4 rounded-[var(--radius-sm)] bg-primary-50 px-4 py-2 text-sm text-primary">
          {t("aboutProduct", { product: productLabel })}
        </p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input {...register("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("name")} error={errors.name?.message}>
            <Input {...register("name")} autoComplete="name" />
          </Field>
          <Field label={t("email")} error={errors.email?.message}>
            <Input type="email" {...register("email")} autoComplete="email" />
          </Field>
          <Field label={t("phone")}>
            <Input type="tel" {...register("phone")} autoComplete="tel" />
          </Field>
          <Field label={t("eventDate")}>
            <Input type="date" {...register("eventDate")} />
          </Field>
        </div>
        <Field label={t("message")} error={errors.message?.message}>
          <Textarea rows={5} {...register("message")} />
        </Field>
        <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full sm:w-auto">
          {pending ? t("submitting") : t("submit")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("noPaymentNote")}</p>
      </form>
    </Card>
  );
}
