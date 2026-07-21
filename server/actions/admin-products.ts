"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";
import { submitToIndexNow, localizedUrls } from "@/lib/indexnow";

export type AdminActionResult = { ok: boolean; error?: string; id?: string };

const dollarsToCents = (v?: string) => {
  if (!v || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

/* ───────────────── Products ───────────────── */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "product";

/** Auto-generate a slug guaranteed unique (appends -2, -3, … if taken). */
async function uniqueSlug(base: string): Promise<string> {
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
  }
}

const productSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().min(2).max(160),
  // The following are optional in the form now — auto-derived / auto-filled.
  nameFr: z.string().max(160).optional().or(z.literal("")),
  slug: z.string().max(160).optional().or(z.literal("")),
  sku: z.string().max(60).optional().or(z.literal("")),
  type: z.enum(["SALE", "RENTAL", "BOTH"]),
  // Status & featured are set on the backend (new products default to ACTIVE)
  // and preserved on edit — they're no longer form fields.
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]).optional(),
  salePrice: z.string().optional(),
  dailyRate: z.string().optional(),
  deposit: z.string().optional(),
  categoryId: z.string().optional(),
  featured: z.boolean().optional(),
  shortEn: z.string().max(400).optional().or(z.literal("")),
  shortFr: z.string().max(400).optional().or(z.literal("")),
  descEn: z.string().max(5000).optional().or(z.literal("")),
  descFr: z.string().max(5000).optional().or(z.literal("")),
  // Specifications (all optional, free text).
  capacity: z.string().optional().or(z.literal("")),
  ageRange: z.string().max(60).optional().or(z.literal("")),
  dimensions: z.string().max(200).optional().or(z.literal("")),
  weight: z.string().max(60).optional().or(z.literal("")),
  powerRequired: z.string().max(160).optional().or(z.literal("")),
  setupArea: z.string().max(200).optional().or(z.literal("")),
  featuresEn: z.string().max(3000).optional().or(z.literal("")),
  featuresFr: z.string().max(3000).optional().or(z.literal("")),
  // Ordered image URLs (uploaded to R2). First is the primary image.
  images: z.array(z.string().url()).max(12).optional(),
});

/** Zip EN/FR feature lines into [{ en, fr }] (FR falls back to EN per line). */
function buildFeatures(en?: string, fr?: string) {
  const enLines = (en ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const frLines = (fr ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (enLines.length === 0) return null;
  return enLines.map((line, i) => ({ en: line, fr: frLines[i] ?? line }));
}

export async function saveProduct(
  input: z.input<typeof productSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("product.write");
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  const d = parsed.data;

  // French fields are optional in the form now — fall back to English so the
  // bilingual site still renders. Slug/SKU are auto-derived on create.
  const data = {
    name: { en: d.nameEn, fr: d.nameFr?.trim() || d.nameEn },
    type: d.type,
    salePriceCents: dollarsToCents(d.salePrice),
    dailyRateCents: dollarsToCents(d.dailyRate),
    depositCents: dollarsToCents(d.deposit),
    categoryId: d.categoryId || null,
    shortDescription: {
      en: d.shortEn ?? "",
      fr: d.shortFr?.trim() || d.shortEn || "",
    },
    description: { en: d.descEn ?? "", fr: d.descFr?.trim() || d.descEn || "" },
    capacity:
      d.capacity && d.capacity.trim() !== ""
        ? Number.parseInt(d.capacity, 10) || null
        : null,
    ageRange: d.ageRange?.trim() || null,
    powerRequired: d.powerRequired?.trim() || null,
    dimensions:
      d.dimensions?.trim() || d.weight?.trim()
        ? {
            size: d.dimensions?.trim() || undefined,
            weight: d.weight?.trim() || undefined,
          }
        : Prisma.JsonNull,
    spaceRequired: d.setupArea?.trim()
      ? { value: d.setupArea.trim() }
      : Prisma.JsonNull,
    features: buildFeatures(d.featuresEn, d.featuresFr) ?? Prisma.JsonNull,
    searchText: `${d.nameEn} ${d.shortEn ?? ""}`,
  };

  try {
    let id = d.id;
    // Slug stays stable: derived once on create, never changed on edit (URLs).
    // Status is auto-set to ACTIVE on create and preserved on edit.
    let slug = "";
    let status = "ACTIVE";
    if (id) {
      const row = await prisma.product.update({
        where: { id },
        data,
        select: { slug: true, status: true },
      });
      slug = row.slug;
      status = row.status;
    } else {
      slug = await uniqueSlug(slugify(d.nameEn));
      const created = await prisma.product.create({
        data: {
          ...data,
          slug,
          sku: `BWS-${slug.toUpperCase()}`,
          status: "ACTIVE",
          featured: d.featured ?? false,
        },
        select: { id: true },
      });
      id = created.id;
    }

    // Sync product images (uploaded to R2 by the form) → ProductMedia.
    // First image becomes the primary; ordering is preserved.
    if (d.images) {
      await prisma.productMedia.deleteMany({ where: { productId: id } });
      if (d.images.length) {
        await prisma.productMedia.createMany({
          data: d.images.map((url, i) => ({
            productId: id as string,
            url,
            isPrimary: i === 0,
            order: i,
          })),
        });
      }
    }

    await logActivity(session.id, d.id ? "product.update" : "product.create", {
      entityType: "Product",
      entityId: id,
      summary: `${d.id ? "Updated" : "Created"} product ${d.nameEn}`,
    });
    revalidateTag("products");
    revalidatePath("/admin/products");
    // Notify search engines instantly when an active product changes.
    if (status === "ACTIVE") {
      const paths: string[] = [];
      if (d.type === "RENTAL" || d.type === "BOTH")
        paths.push(`/rent/${slug}`, "/rent");
      if (d.type === "SALE" || d.type === "BOTH")
        paths.push(`/shop/${slug}`, "/shop");
      void submitToIndexNow(paths.flatMap((p) => localizedUrls(p)));
    }
    return { ok: true, id };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique")
        ? "Slug or SKU already in use."
        : "Couldn't save the product.";
    return { ok: false, error: message };
  }
}

export async function deleteProduct(id: string): Promise<AdminActionResult> {
  const session = await requirePermission("product.delete");
  try {
    // CartItem is the only relation that blocks a product delete (required FK,
    // no cascade) — visitors' abandoned carts were silently preventing deletes.
    // Clear those lines first, then delete. Order/booking items are safe by
    // design: they keep a snapshot of the name/price and auto-null their
    // product link, so history and past invoices stay intact.
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
    await logActivity(session.id, "product.delete", {
      entityType: "Product",
      entityId: id,
    });
    revalidateTag("products");
    revalidatePath("/admin/products");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Couldn't delete this product. Please try again.",
    };
  }
}

/* ───────────────── Categories ───────────────── */

const categorySchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().min(2).max(120),
  nameFr: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens"),
  order: z.string().optional(),
});

export async function saveCategory(
  input: z.input<typeof categorySchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("category.write");
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  const d = parsed.data;
  const data = {
    name: { en: d.nameEn, fr: d.nameFr },
    slug: d.slug,
    order: d.order ? Number(d.order) || 0 : 0,
  };
  try {
    if (d.id)
      await prisma.productCategory.update({ where: { id: d.id }, data });
    else await prisma.productCategory.create({ data });
    await logActivity(session.id, "category.write", {
      entityType: "ProductCategory",
      summary: `Saved category ${d.nameEn}`,
    });
    revalidateTag("categories");
    revalidatePath("/admin/products/categories");
    return { ok: true };
  } catch {
    return { ok: false, error: "Slug already in use, or save failed." };
  }
}

export async function deleteCategory(id: string): Promise<AdminActionResult> {
  const session = await requirePermission("category.write");
  try {
    const inUse = await prisma.product.count({ where: { categoryId: id } });
    if (inUse > 0) {
      return {
        ok: false,
        error: `${inUse} product(s) still use this category. Reassign them first.`,
      };
    }
    await prisma.productCategory.delete({ where: { id } });
    await logActivity(session.id, "category.delete", {
      entityType: "ProductCategory",
      entityId: id,
    });
    revalidateTag("categories");
    revalidatePath("/admin/products/categories");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete the category." };
  }
}

/* ───────────────── Inventory (rental units) ───────────────── */

export async function addRentalUnit(
  productId: string,
  unitLabel: string,
): Promise<AdminActionResult> {
  const session = await requirePermission("inventory.write");
  if (!productId || unitLabel.trim().length < 1) {
    return { ok: false, error: "Enter a unit label." };
  }
  try {
    await prisma.rentalUnit.create({
      data: { productId, unitLabel: unitLabel.trim() },
    });
    await logActivity(session.id, "inventory.write", {
      entityType: "RentalUnit",
      entityId: productId,
    });
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't add the unit." };
  }
}

export async function toggleRentalUnit(id: string): Promise<AdminActionResult> {
  await requirePermission("inventory.write");
  try {
    const unit = await prisma.rentalUnit.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!unit) return { ok: false, error: "Unit not found." };
    await prisma.rentalUnit.update({
      where: { id },
      data: { isActive: !unit.isActive },
    });
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the unit." };
  }
}
