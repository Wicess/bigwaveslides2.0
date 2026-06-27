"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Star, X } from "lucide-react";
import { saveProduct } from "@/server/actions/admin-products";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/media/upload-dropzone";

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
  // Specifications a renter/buyer needs to know.
  capacity: string;
  ageRange: string;
  dimensions: string;
  weight: string;
  powerRequired: string;
  setupArea: string;
  featuresEn: string;
  featuresFr: string;
  images: string[];
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
  const [images, setImages] = useState<string[]>(defaults.images ?? []);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({ defaultValues: defaults });

  const addImage = (url: string) => setImages((prev) => [...prev, url]);
  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));
  const makePrimary = (url: string) =>
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);

  const onSubmit = (values: ProductFormValues) =>
    startTransition(async () => {
      const res = await saveProduct({ ...values, id: defaults.id, images });
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

      {/* Specifications — the spec sheet shown to renters/buyers. */}
      <section className="space-y-4 rounded-[var(--radius-lg)] border border-border p-4">
        <p className="text-sm font-semibold">Specifications</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Capacity (people)">
            <Input type="number" min="0" placeholder="e.g. 4" {...register("capacity")} />
          </Field>
          <Field label="Age range">
            <Input placeholder="e.g. 5+" {...register("ageRange")} />
          </Field>
          <Field label="Weight">
            <Input placeholder="e.g. 285 lbs" {...register("weight")} />
          </Field>
          <Field label="Dimensions (L × W × H)">
            <Input placeholder="e.g. 28 ft L × 14 ft W × 18 ft H" {...register("dimensions")} />
          </Field>
          <Field label="Power required">
            <Input placeholder="e.g. 2 × 1.5 HP blowers, 110V" {...register("powerRequired")} />
          </Field>
          <Field label="Setup space needed">
            <Input placeholder="e.g. 33 × 19 ft level area" {...register("setupArea")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Features (EN — one per line)">
            <Textarea rows={5} placeholder={"Commercial-grade vinyl\nSafety netting\nFully insured"} {...register("featuresEn")} />
          </Field>
          <Field label="Features (FR — one per line)">
            <Textarea rows={5} {...register("featuresFr")} />
          </Field>
        </div>
      </section>

      {/* Images — uploaded straight to Cloudflare R2 */}
      <section className="space-y-3">
        <span className="text-sm font-medium">Product images</span>
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <div key={url} className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-border">
                <div className="aspect-square bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                </div>
                {i === 0 ? (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    Primary
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {i !== 0 ? (
                    <button type="button" onClick={() => makePrimary(url)} title="Make primary" className="grid size-7 place-items-center rounded-full bg-background/90 text-foreground hover:text-primary">
                      <Star className="size-3.5" />
                    </button>
                  ) : null}
                  <button type="button" onClick={() => removeImage(url)} title="Remove" className="grid size-7 place-items-center rounded-full bg-background/90 text-foreground hover:text-red-600">
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No images yet. Upload below — the first image is the primary one shown on cards.</p>
        )}
        <UploadDropzone folder="products" accept="image/*" onUploaded={(m) => addImage(m.url)} />
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
