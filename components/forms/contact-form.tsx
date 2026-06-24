"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { submitContact } from "@/server/actions/contact";
import { trackEvent } from "@/lib/analytics/client";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EASE_OUT } from "@/components/motion/variants";

const formSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Tell us a little more"),
  website: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

const fieldClass = "h-12 rounded-lg border-border bg-white px-4";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="mt-1 block text-xs font-medium text-red-600">{msg}</span>;
}

export function ContactForm() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
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
        trackEvent({ type: "CONTACT" });
        reset();
        setDone(true);
      } else {
        toast.error(res.error ?? t("error"));
      }
    });
  };

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div
          key="done"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <span className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary">
            <CheckCircle2 className="size-8" />
          </span>
          <h3 className="mt-4 text-xl font-bold">{t("successTitle")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("successNext")}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => setDone(false)}
          >
            {t("sendAnother")}
          </Button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3.5"
          noValidate
        >
          <input
            {...register("website")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="hidden"
          />

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <Input
                {...register("name")}
                placeholder={t("phName")}
                aria-label={t("formName")}
                autoComplete="name"
                className={fieldClass}
              />
              <FieldError msg={errors.name?.message} />
            </div>
            <div>
              <Input
                type="email"
                {...register("email")}
                placeholder={t("phEmail")}
                aria-label={t("formEmail")}
                autoComplete="email"
                className={fieldClass}
              />
              <FieldError msg={errors.email?.message} />
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input
              type="tel"
              {...register("phone")}
              placeholder={t("phPhone")}
              aria-label={t("formPhone")}
              autoComplete="tel"
              className={fieldClass}
            />
            <Input
              {...register("subject")}
              placeholder={t("phSubject")}
              aria-label={t("formSubject")}
              className={fieldClass}
            />
          </div>

          <div>
            <Textarea
              rows={4}
              {...register("message")}
              placeholder={t("phMessage")}
              aria-label={t("formMessage")}
              className="rounded-lg border-border bg-white px-4"
            />
            <FieldError msg={errors.message?.message} />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={pending}
          >
            {!pending ? <Send className="size-4" /> : null}
            {pending ? t("sending") : t("send")}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
