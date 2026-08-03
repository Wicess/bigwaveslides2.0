"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/server/actions/admin-governance";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SettingsValues = {
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactStreet: string;
  contactCity: string;
  contactState: string;
  contactZip: string;
  contactCountry: string;
  hoursMonFri: string;
  hoursSat: string;
  hoursSun: string;
  deliveryBase: string;
  pickup: string;
  perMile: string;
  freeRadius: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  reviewsUrl: string;
};

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="border-border flex items-baseline justify-between gap-3 border-b pb-1.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint ? (
          <span className="text-muted-foreground text-right text-[11px] leading-tight">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SettingsForm({ defaults }: { defaults: SettingsValues }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { register, handleSubmit } = useForm<SettingsValues>({
    defaultValues: defaults,
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const res = await saveSettings(values);
          if (res.ok) {
            toast.success("Settings saved");
            router.refresh();
          } else toast.error(res.error ?? "Save failed");
        }),
      )}
      className="space-y-6"
    >
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <Group title="Contact">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" className="col-span-2">
                <Input type="email" {...register("contactEmail")} />
              </Field>
              <Field label="Phone">
                <Input {...register("contactPhone")} />
              </Field>
              <Field label="WhatsApp (digits)">
                <Input {...register("contactWhatsapp")} />
              </Field>
            </div>
          </Group>

          <Group
            title="Business address"
            hint="Shown in the footer + your Google/AI structured address"
          >
            <div className="space-y-3">
              <Field label="Street + Suite">
                <Input
                  placeholder="1717 Main Street, Suite 3300"
                  {...register("contactStreet")}
                />
              </Field>
              <div className="grid grid-cols-6 gap-3">
                <Field label="City" className="col-span-3">
                  <Input placeholder="Dallas" {...register("contactCity")} />
                </Field>
                <Field label="State" className="col-span-1">
                  <Input
                    placeholder="TX"
                    maxLength={2}
                    {...register("contactState")}
                  />
                </Field>
                <Field label="ZIP" className="col-span-2">
                  <Input placeholder="75201" {...register("contactZip")} />
                </Field>
              </div>
              <Field label="Country (2-letter)" className="w-24">
                <Input
                  placeholder="US"
                  maxLength={2}
                  {...register("contactCountry")}
                />
              </Field>
            </div>
          </Group>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Group title="Opening hours">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Mon–Fri">
                <Input {...register("hoursMonFri")} />
              </Field>
              <Field label="Saturday">
                <Input {...register("hoursSat")} />
              </Field>
              <Field label="Sunday">
                <Input {...register("hoursSun")} />
              </Field>
            </div>
          </Group>

          <Group title="Fees">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Delivery base ($)">
                <Input
                  type="number"
                  step="0.01"
                  {...register("deliveryBase")}
                />
              </Field>
              <Field label="Pickup ($)">
                <Input type="number" step="0.01" {...register("pickup")} />
              </Field>
              <Field label="Per mile ($)">
                <Input type="number" step="0.01" {...register("perMile")} />
              </Field>
              <Field label="Free radius (mi)">
                <Input type="number" {...register("freeRadius")} />
              </Field>
            </div>
          </Group>

          <Group title="Social">
            <div className="space-y-3">
              <Field label="Instagram">
                <Input
                  placeholder="https://instagram.com/…"
                  {...register("instagram")}
                />
              </Field>
              <Field label="Facebook">
                <Input
                  placeholder="https://facebook.com/…"
                  {...register("facebook")}
                />
              </Field>
              <Field label="TikTok">
                <Input
                  placeholder="https://tiktok.com/@…"
                  {...register("tiktok")}
                />
              </Field>
            </div>
          </Group>

          <Group
            title="Reviews link"
            hint="Google Business or Trustpilot URL. When set, the payment page shows a clickable “verified reviews” link — leave blank to hide it."
          >
            <Field label="Public reviews profile">
              <Input
                placeholder="https://g.page/r/… or https://trustpilot.com/review/…"
                {...register("reviewsUrl")}
              />
            </Field>
          </Group>
        </div>
      </div>

      <div className="border-border flex items-center justify-end border-t pt-4">
        <Button type="submit" variant="gradient" loading={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
