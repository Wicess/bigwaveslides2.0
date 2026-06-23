"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { saveEvent, deleteEvent } from "@/server/actions/admin-events";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type EventFormValues = {
  id?: string;
  titleEn: string;
  titleFr: string;
  slug: string;
  excerptEn: string;
  excerptFr: string;
  descEn: string;
  descFr: string;
  status: "UPCOMING" | "ONGOING" | "PAST" | "CANCELLED";
  startAt: string;
  endAt: string;
  location: string;
  coverImage: string;
  capacity: string;
  registrationEnabled: boolean;
  featured: boolean;
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function EventForm({ defaults }: { defaults: EventFormValues }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    defaultValues: defaults,
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const res = await saveEvent({ ...values, id: defaults.id });
          if (res.ok) {
            toast.success("Event saved");
            router.push("/admin/events");
            router.refresh();
          } else {
            toast.error(res.error ?? "Save failed");
          }
        }),
      )}
      className="space-y-6"
    >
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Title (EN)" error={errors.titleEn?.message}><Input {...register("titleEn", { required: "Required" })} /></Field>
        <Field label="Title (FR)" error={errors.titleFr?.message}><Input {...register("titleFr", { required: "Required" })} /></Field>
        <Field label="Slug" error={errors.slug?.message}><Input {...register("slug", { required: "Required" })} /></Field>
        <Field label="Location"><Input {...register("location")} /></Field>
        <Field label="Start" error={errors.startAt?.message}><Input type="datetime-local" {...register("startAt", { required: "Required" })} /></Field>
        <Field label="End"><Input type="datetime-local" {...register("endAt")} /></Field>
        <Field label="Status">
          <Select {...register("status")}>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="PAST">Past</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </Field>
        <Field label="Capacity"><Input type="number" min="0" {...register("capacity")} /></Field>
        <Field label="Cover image URL"><Input {...register("coverImage")} placeholder="https://…" /></Field>
        <div className="flex items-center gap-6 self-end pb-2.5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="size-4 rounded border-border" {...register("registrationEnabled")} />
            Registration
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="size-4 rounded border-border" {...register("featured")} />
            Featured
          </label>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Excerpt (EN)"><Textarea rows={2} {...register("excerptEn")} /></Field>
        <Field label="Excerpt (FR)"><Textarea rows={2} {...register("excerptFr")} /></Field>
        <Field label="Description (EN)"><Textarea rows={6} {...register("descEn")} /></Field>
        <Field label="Description (FR)"><Textarea rows={6} {...register("descFr")} /></Field>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="gradient" loading={pending}>{pending ? "Saving…" : "Save event"}</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/events")}>Cancel</Button>
        {defaults.id ? (
          <Button
            type="button"
            variant="outline"
            className="ml-auto text-red-600 hover:border-red-300"
            onClick={() => {
              if (!confirm("Delete this event?")) return;
              start(async () => {
                const res = await deleteEvent(defaults.id!);
                if (res.ok) { toast.success("Deleted"); router.push("/admin/events"); router.refresh(); }
                else toast.error(res.error ?? "Failed");
              });
            }}
          >
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
