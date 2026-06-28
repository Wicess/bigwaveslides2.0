"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  MessageSquare,
  Send,
  type LucideIcon,
} from "lucide-react";
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
  icon: Icon,
  error,
  required,
  children,
}: {
  label: string;
  icon: LucideIcon;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground/80">
        {label}
        {required ? <span className="ml-0.5 text-primary">*</span> : null}
      </span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </span>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border-border bg-muted/30 pl-10 transition-colors focus:bg-background";

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
        <Field label={t("name")} icon={User} required error={errors.name?.message}>
          <Input className={inputCls} {...register("name")} autoComplete="name" />
        </Field>
        <Field label={t("email")} icon={Mail} required error={errors.email?.message}>
          <Input className={inputCls} type="email" {...register("email")} autoComplete="email" />
        </Field>
        <Field label={t("phone")} icon={Phone} required error={errors.phone?.message}>
          <Input className={inputCls} type="tel" {...register("phone")} autoComplete="tel" />
        </Field>
        <Field label={t("eventDate")} icon={Calendar}>
          <Input className={inputCls} type="date" {...register("eventDate")} />
        </Field>
        <Field label={t("address")} icon={MapPin}>
          <Input className={inputCls} {...register("address")} autoComplete="street-address" />
        </Field>
        <Field label={t("city")} icon={Building2}>
          <Input className={inputCls} {...register("city")} autoComplete="address-level2" />
        </Field>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground/80">{t("notes")}</span>
        <span className="relative block">
          <MessageSquare className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <Textarea
            rows={3}
            className="rounded-xl border-border bg-muted/30 pl-10 transition-colors focus:bg-background"
            {...register("notes")}
            placeholder={t("notesPlaceholder")}
          />
        </span>
      </label>

      <Button
        type="submit"
        size="lg"
        variant="gradient"
        loading={pending}
        className="w-full gap-2 text-base shadow-[0_10px_30px_-10px_rgba(0,153,255,0.7)]"
      >
        {!pending ? <Send className="size-4" /> : null}
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("noPaymentNote")}</p>
    </form>
  );
}
