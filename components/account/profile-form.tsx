"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/server/actions/account";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  phone: z.string().optional(),
  organizationName: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
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

export function ProfileForm({
  defaults,
  email,
}: {
  defaults: Values;
  email: string;
}) {
  const t = useTranslations("Account");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const res = await updateProfile(values);
          if (res.ok) toast.success(t("profileSaved"));
          else toast.error(res.error ?? t("genericError"));
        }),
      )}
      className="space-y-4"
    >
      <Field label={t("email")}>
        <Input value={email} disabled readOnly />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")} error={errors.name?.message}>
          <Input autoComplete="name" {...register("name")} />
        </Field>
        <Field label={t("phone")}>
          <Input type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>
      <Field label={t("organization")}>
        <Input {...register("organizationName")} />
      </Field>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" className="mt-0.5 size-4 rounded border-border" {...register("marketingOptIn")} />
        <span>{t("marketing")}</span>
      </label>
      <Button type="submit" variant="gradient" loading={pending}>
        {pending ? t("saving") : t("saveChanges")}
      </Button>
    </form>
  );
}
