"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { createOrderRequest } from "@/server/actions/orders";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(5, "Enter a phone number"),
  address: z.string().optional(),
  city: z.string().optional(),
  eventDate: z.string().optional(),
  notes: z.string().optional(),
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

export function OrderRequestForm({
  onSuccess,
}: {
  onSuccess: (orderNumber: string) => void;
}) {
  const t = useTranslations("OrderRequest");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await createOrderRequest({ ...values, locale });
      if (res.ok) {
        onSuccess(res.orderNumber);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")} error={errors.name?.message}>
          <Input {...register("name")} autoComplete="name" />
        </Field>
        <Field label={t("email")} error={errors.email?.message}>
          <Input type="email" {...register("email")} autoComplete="email" />
        </Field>
        <Field label={t("phone")} error={errors.phone?.message}>
          <Input type="tel" {...register("phone")} autoComplete="tel" />
        </Field>
        <Field label={t("eventDate")}>
          <Input type="date" {...register("eventDate")} />
        </Field>
        <Field label={t("address")}>
          <Input {...register("address")} autoComplete="street-address" />
        </Field>
        <Field label={t("city")}>
          <Input {...register("city")} autoComplete="address-level2" />
        </Field>
      </div>

      <Field label={t("notes")}>
        <Textarea rows={3} {...register("notes")} placeholder={t("notesPlaceholder")} />
      </Field>

      <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full">
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("noPaymentNote")}</p>
    </form>
  );
}
