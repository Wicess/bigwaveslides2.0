"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, FileSignature } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createBookingRequest } from "@/server/actions/bookings";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const schema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an end date"),
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(5, "Enter a phone number"),
  address: z.string().min(3, "Enter the delivery address"),
  city: z.string().min(2, "Enter the city"),
  eventType: z.string().optional(),
  headcount: z.string().optional(),
  surfaceType: z.string().optional(),
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

export function BookingForm({
  productId,
  defaultStart,
  defaultEnd,
  surfaceOptions,
}: {
  productId: string;
  defaultStart?: string;
  defaultEnd?: string;
  surfaceOptions: { value: string; label: string }[];
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<{ booking: string; contract: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { startDate: defaultStart, endDate: defaultEnd ?? defaultStart },
  });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await createBookingRequest({
        ...values,
        productId,
        headcount: values.headcount ? Number(values.headcount) : undefined,
        locale,
      });
      if (res.ok) setDone({ booking: res.bookingNumber, contract: res.contractNumber });
      else toast.error(res.error);
    });
  };

  if (done) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">{t("successTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("successBody")}</p>
        <p className="mt-4 inline-block rounded-full bg-muted px-4 py-2 font-mono text-sm font-semibold">
          {t("bookingRef")}: {done.booking}
        </p>
        {done.contract ? (
          <div className="mt-6">
            <Button asChild size="lg" variant="gradient">
              <Link href={`/contract/${done.contract}`}>
                <FileSignature className="size-5" />
                {t("reviewContract")}
              </Link>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">{t("contractHint")}</p>
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input {...register("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("eventSection")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("startDate")} error={errors.startDate?.message}>
            <Input type="date" {...register("startDate")} />
          </Field>
          <Field label={t("endDate")} error={errors.endDate?.message}>
            <Input type="date" {...register("endDate")} />
          </Field>
          <Field label={t("eventType")}>
            <Input {...register("eventType")} placeholder={t("eventTypePlaceholder")} />
          </Field>
          <Field label={t("headcount")}>
            <Input type="number" min={0} {...register("headcount")} />
          </Field>
          <Field label={t("surfaceType")}>
            <select
              {...register("surfaceType")}
              className="h-11 w-full rounded-[var(--radius-sm)] border border-border bg-background px-4 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <option value="">{t("surfaceSelect")}</option>
              {surfaceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("deliverySection")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("address")} error={errors.address?.message}>
            <Input {...register("address")} autoComplete="street-address" />
          </Field>
          <Field label={t("city")} error={errors.city?.message}>
            <Input {...register("city")} autoComplete="address-level2" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("contactSection")}</legend>
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
        </div>
        <Field label={t("notes")}>
          <Textarea rows={3} {...register("notes")} placeholder={t("notesPlaceholder")} />
        </Field>
      </fieldset>

      <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full">
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("noPaymentNote")}</p>
    </form>
  );
}
