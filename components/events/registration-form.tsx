"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { registerForEvent } from "@/server/actions/event-registration";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  partySize: z.string().optional(),
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

export function RegistrationForm({ eventId }: { eventId: string }) {
  const t = useTranslations("EventRegistration");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { partySize: "1" } });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await registerForEvent({
        ...values,
        eventId,
        partySize: values.partySize ? Number(values.partySize) : 1,
      });
      if (res.ok) setDone(true);
      else toast.error(res.error);
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-border p-8 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <h3 className="text-xl font-semibold">{t("successTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("successBody")}</p>
      </div>
    );
  }

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
        <Field label={t("phone")}>
          <Input type="tel" {...register("phone")} autoComplete="tel" />
        </Field>
        <Field label={t("partySize")}>
          <Input type="number" min={1} max={100} {...register("partySize")} />
        </Field>
      </div>
      <Field label={t("notes")}>
        <Textarea rows={3} {...register("notes")} />
      </Field>
      <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full sm:w-auto">
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("noPaymentNote")}</p>
    </form>
  );
}
