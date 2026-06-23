"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { submitContact } from "@/server/actions/contact";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Tell us a little more"),
  website: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

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

export function ContactForm() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const res = await submitContact({ ...values, locale });
      if (res.ok) {
        toast.success(t("success"));
        reset();
      } else {
        toast.error(res.error ?? t("error"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input
        {...register("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("formName")} error={errors.name?.message}>
          <Input {...register("name")} autoComplete="name" />
        </Field>
        <Field label={t("formEmail")} error={errors.email?.message}>
          <Input type="email" {...register("email")} autoComplete="email" />
        </Field>
        <Field label={t("formPhone")}>
          <Input type="tel" {...register("phone")} autoComplete="tel" />
        </Field>
        <Field label={t("formSubject")}>
          <Input {...register("subject")} />
        </Field>
      </div>
      <Field label={t("formMessage")} error={errors.message?.message}>
        <Textarea rows={5} {...register("message")} />
      </Field>
      <Button type="submit" size="lg" loading={pending}>
        {pending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
