"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { saveProduct } from "@/server/actions/admin-products";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ProductFormValues = {
  id?: string;
  nameEn: string;
  nameFr: string;
  slug: string;
  sku: string;
  type: "SALE" | "RENTAL" | "BOTH";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";
  salePrice: string;
  dailyRate: string;
  deposit: string;
  categoryId: string;
  featured: boolean;
  shortEn: string;
  shortFr: string;
  descEn: string;
  descFr: string;
};

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

export function ProductForm({
  defaults,
  categories,
}: {
  defaults: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({ defaultValues: defaults });

  const onSubmit = (values: ProductFormValues) =>
    startTransition(async () => {
      const res = await saveProduct({ ...values, id: defaults.id });
      if (res.ok) {
        toast.success("Product saved");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(res.error ?? "Save failed");
      }
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (EN)" error={errors.nameEn?.message}>
          <Input {...register("nameEn", { required: "Required" })} />
        </Field>
        <Field label="Name (FR)" error={errors.nameFr?.message}>
          <Input {...register("nameFr", { required: "Required" })} />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <Input {...register("slug", { required: "Required" })} />
        </Field>
        <Field label="SKU" error={errors.sku?.message}>
          <Input {...register("sku", { required: "Required" })} />
        </Field>
        <Field label="Type">
          <Select {...register("type")}>
            <option value="RENTAL">Rental</option>
            <option value="SALE">Sale</option>
            <option value="BOTH">Both</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select {...register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </Select>
        </Field>
        <Field label="Category">
          <Select {...register("categoryId")}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
          <input type="checkbox" className="size-4 rounded border-border" {...register("featured")} />
          Featured
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Field label="Sale price ($)"><Input type="number" step="0.01" min="0" {...register("salePrice")} /></Field>
        <Field label="Daily rate ($)"><Input type="number" step="0.01" min="0" {...register("dailyRate")} /></Field>
        <Field label="Deposit ($)"><Input type="number" step="0.01" min="0" {...register("deposit")} /></Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Short description (EN)"><Textarea rows={2} {...register("shortEn")} /></Field>
        <Field label="Short description (FR)"><Textarea rows={2} {...register("shortFr")} /></Field>
        <Field label="Description (EN)"><Textarea rows={5} {...register("descEn")} /></Field>
        <Field label="Description (FR)"><Textarea rows={5} {...register("descFr")} /></Field>
      </section>

      <div className="flex gap-3">
        <Button type="submit" variant="gradient" loading={pending}>
          {pending ? "Saving…" : "Save product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
