"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  registerCustomer,
  signInWithCredentials,
  requestPasswordReset,
  resetPassword,
} from "@/server/actions/auth";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

/* ───────────────── Sign in ───────────────── */

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export function SignInForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signInSchema>>({ resolver: zodResolver(signInSchema) });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const res = await signInWithCredentials(values);
          if (res.ok) {
            router.push("/account");
            router.refresh();
          } else {
            toast.error(res.error ?? t("genericError"));
          }
        }),
      )}
      className="space-y-4"
    >
      <Field label={t("email")} error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label={t("password")} error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </Field>
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          {t("forgotLink")}
        </Link>
      </div>
      <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full">
        {pending ? t("signingIn") : t("signIn")}
      </Button>
    </form>
  );
}

/* ───────────────── Sign up ───────────────── */

const signUpSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  marketingOptIn: z.boolean().optional(),
});

export function SignUpForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signUpSchema>>({ resolver: zodResolver(signUpSchema) });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const res = await registerCustomer({ ...values, locale });
          if (res.ok) {
            router.push("/account");
            router.refresh();
          } else {
            toast.error(res.error ?? t("genericError"));
          }
        }),
      )}
      className="space-y-4"
    >
      <Field label={t("name")} error={errors.name?.message}>
        <Input autoComplete="name" {...register("name")} />
      </Field>
      <Field label={t("email")} error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label={t("password")} error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" className="mt-0.5 size-4 rounded border-border" {...register("marketingOptIn")} />
        <span>{t("marketing")}</span>
      </label>
      <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full">
        {pending ? t("creating") : t("createAccount")}
      </Button>
    </form>
  );
}

/* ───────────────── Forgot password ───────────────── */

const forgotSchema = z.object({ email: z.string().email("Enter a valid email") });

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <p className="text-sm text-muted-foreground">{t("resetSent")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          await requestPasswordReset(values);
          setSent(true);
        }),
      )}
      className="space-y-4"
    >
      <Field label={t("email")} error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full">
        {pending ? t("sending") : t("sendResetLink")}
      </Button>
    </form>
  );
}

/* ───────────────── Reset password ───────────────── */

const resetFormSchema = z.object({ password: z.string().min(8, "Use at least 8 characters") });

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof resetFormSchema>>({ resolver: zodResolver(resetFormSchema) });

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <p className="text-sm text-muted-foreground">{t("resetDone")}</p>
        <Button asChild variant="gradient">
          <Link href="/sign-in">{t("signIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const res = await resetPassword({ token, password: values.password });
          if (res.ok) {
            setDone(true);
          } else {
            toast.error(res.error ?? t("genericError"));
          }
        }),
      )}
      className="space-y-4"
    >
      <Field label={t("newPassword")} error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full">
        {pending ? t("saving") : t("resetPassword")}
      </Button>
    </form>
  );
}
