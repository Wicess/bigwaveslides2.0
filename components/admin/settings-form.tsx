"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/server/actions/admin-governance";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SettingsValues = {
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactAddress: string;
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
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function SettingsForm({ defaults }: { defaults: SettingsValues }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { register, handleSubmit } = useForm<SettingsValues>({ defaultValues: defaults });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const res = await saveSettings(values);
          if (res.ok) { toast.success("Settings saved"); router.refresh(); }
          else toast.error(res.error ?? "Save failed");
        }),
      )}
      className="space-y-8"
    >
      <section>
        <h2 className="mb-3 font-semibold">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email"><Input type="email" {...register("contactEmail")} /></Field>
          <Field label="Phone"><Input {...register("contactPhone")} /></Field>
          <Field label="WhatsApp (digits)"><Input {...register("contactWhatsapp")} /></Field>
          <Field label="Address"><Input {...register("contactAddress")} /></Field>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Opening hours</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Mon–Fri"><Input {...register("hoursMonFri")} /></Field>
          <Field label="Saturday"><Input {...register("hoursSat")} /></Field>
          <Field label="Sunday"><Input {...register("hoursSun")} /></Field>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Fees</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Delivery base ($)"><Input type="number" step="0.01" {...register("deliveryBase")} /></Field>
          <Field label="Pickup ($)"><Input type="number" step="0.01" {...register("pickup")} /></Field>
          <Field label="Per mile ($)"><Input type="number" step="0.01" {...register("perMile")} /></Field>
          <Field label="Free radius (mi)"><Input type="number" {...register("freeRadius")} /></Field>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Social</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram"><Input {...register("instagram")} /></Field>
          <Field label="Facebook"><Input {...register("facebook")} /></Field>
          <Field label="TikTok"><Input {...register("tiktok")} /></Field>
        </div>
      </section>

      <Button type="submit" variant="gradient" loading={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
