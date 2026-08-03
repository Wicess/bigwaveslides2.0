"use client";

import { useState, useTransition } from "react";
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
  Tag,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { createOrderRequest, applyPromoToCart } from "@/server/actions/orders";
import { formatPrice } from "@/lib/format";
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
      <span className="text-foreground/80 text-sm font-medium">
        {label}
        {required ? <span className="text-primary ml-0.5">*</span> : null}
      </span>
      <span className="relative block">
        <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
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

  // Promo code (applied live against the cart before submitting).
  const [promoInput, setPromoInput] = useState("");
  const [promoPending, setPromoPending] = useState(false);
  const [applied, setApplied] = useState<{
    code: string;
    label: string;
    discountCents: number;
  } | null>(null);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code || promoPending) return;
    setPromoPending(true);
    const res = await applyPromoToCart(code);
    setPromoPending(false);
    if (res.ok) {
      setApplied({
        code: res.code,
        label: res.label,
        discountCents: res.discountCents,
      });
      toast.success(t("promoApplied", { code: res.code }));
    } else {
      setApplied(null);
      toast.error(res.error);
    }
  };

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await createOrderRequest({
        ...values,
        promoCode: applied?.code,
        locale,
      });
      if (res.ok) {
        onSuccess(res.orderNumber);
      } else {
        toast.error(res.error);
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
        <Field
          label={t("name")}
          icon={User}
          required
          error={errors.name?.message}
        >
          <Input
            className={inputCls}
            {...register("name")}
            autoComplete="name"
          />
        </Field>
        <Field
          label={t("email")}
          icon={Mail}
          required
          error={errors.email?.message}
        >
          <Input
            className={inputCls}
            type="email"
            {...register("email")}
            autoComplete="email"
          />
        </Field>
        <Field
          label={t("phone")}
          icon={Phone}
          required
          error={errors.phone?.message}
        >
          <Input
            className={inputCls}
            type="tel"
            {...register("phone")}
            autoComplete="tel"
          />
        </Field>
        <Field label={t("eventDate")} icon={Calendar}>
          <Input className={inputCls} type="date" {...register("eventDate")} />
        </Field>
        <Field label={t("address")} icon={MapPin}>
          <Input
            className={inputCls}
            {...register("address")}
            autoComplete="street-address"
          />
        </Field>
        <Field label={t("city")} icon={Building2}>
          <Input
            className={inputCls}
            {...register("city")}
            autoComplete="address-level2"
          />
        </Field>
      </div>

      <label className="block space-y-1.5">
        <span className="text-foreground/80 text-sm font-medium">
          {t("notes")}
        </span>
        <span className="relative block">
          <MessageSquare className="text-muted-foreground pointer-events-none absolute top-3 left-3 size-4" />
          <Textarea
            rows={3}
            className="border-border bg-muted/30 focus:bg-background rounded-xl pl-10 transition-colors"
            {...register("notes")}
            placeholder={t("notesPlaceholder")}
          />
        </span>
      </label>

      {/* Promo code — applied live against the cart before submitting. */}
      <div className="border-border bg-muted/20 rounded-xl border p-3.5">
        {applied ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              {t("promoOn", { code: applied.code })}
              <span className="font-bold">
                −{formatPrice(applied.discountCents, locale)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setApplied(null);
                setPromoInput("");
              }}
              className="text-muted-foreground hover:text-foreground text-xs underline"
            >
              {t("promoRemove")}
            </button>
          </div>
        ) : (
          <div>
            <span className="text-foreground/80 mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <Tag className="text-primary size-4" /> {t("promoLabel")}
            </span>
            <div className="flex gap-2">
              <Input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void applyPromo();
                  }
                }}
                placeholder={t("promoPlaceholder")}
                className="h-11 rounded-xl font-mono tracking-wide uppercase"
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyPromo}
                disabled={promoPending || !promoInput.trim()}
                className="h-11 shrink-0"
              >
                {promoPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t("promoApply")
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

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
    </form>
  );
}
