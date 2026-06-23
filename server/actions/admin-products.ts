"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";

export type AdminActionResult = { ok: boolean; error?: string; id?: string };

const dollarsToCents = (v?: string) => {
  if (!v || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

/* ───────────────── Products ───────────────── */

const productSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().min(2).max(160),
  nameFr: z.string().min(2).max(160),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens"),
  sku: z.string().min(1).max(60),
  type: z.enum(["SALE", "RENTAL", "BOTH"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]),
  salePrice: z.string().optional(),
  dailyRate: z.string().optional(),
  deposit: z.string().optional(),
  categoryId: z.string().optional(),
  featured: z.boolean().optional(),
  shortEn: z.string().max(400).optional().or(z.literal("")),
  shortFr: z.string().max(400).optional().or(z.literal("")),
  descEn: z.string().max(5000).optional().or(z.literal("")),
  descFr: z.string().max(5000).optional().or(z.literal("")),
});

export async function saveProduct(
  input: z.input<typeof productSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("product.write");
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }
  const d = parsed.data;

  const data = {
    name: { en: d.nameEn, fr: d.nameFr },
    slug: d.slug,
    sku: d.sku,
    type: d.type,
    status: d.status,
    salePriceCents: dollarsToCents(d.salePrice),
    dailyRateCents: dollarsToCents(d.dailyRate),
    depositCents: dollarsToCents(d.deposit),
    categoryId: d.categoryId || null,
    featured: d.featured ?? false,
    shortDescription: { en: d.shortEn ?? "", fr: d.shortFr ?? "" },
    description: { en: d.descEn ?? "", fr: d.descFr ?? "" },
    searchText: `${d.nameEn} ${d.shortEn ?? ""} ${d.sku}`,
  };

  try {
    let id = d.id;
    if (id) {
      await prisma.product.update({ where: { id }, data });
    } else {
      const created = await prisma.product.create({ data, select: { id: true } });
      id = created.id;
    }
    await logActivity(session.id, d.id ? "product.update" : "product.create", {
      entityType: "Product",
      entityId: id,
      summary: `${d.id ? "Updated" : "Created"} product ${d.nameEn}`,
    });
    revalidateTag("products");
    revalidatePath("/admin/products");
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
    await prisma.product.delete({ where: { id } });
    await logActivity(session.id, "product.delete", { entityType: "Product", entityId: id });
    revalidateTag("products");
    revalidatePath("/admin/products");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete (it may be referenced by orders)." };
  }
}

/* ───────────────── Categories ───────────────── */

const categorySchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().min(2).max(120),
  nameFr: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens"),
  order: z.string().optional(),
});

export async function saveCategory(
  input: z.input<typeof categorySchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("category.write");
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }
  const d = parsed.data;
  const data = {
    name: { en: d.nameEn, fr: d.nameFr },
    slug: d.slug,
    order: d.order ? Number(d.order) || 0 : 0,
  };
  try {
    if (d.id) await prisma.productCategory.update({ where: { id: d.id }, data });
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
    await prisma.rentalUnit.create({ data: { productId, unitLabel: unitLabel.trim() } });
    await logActivity(session.id, "inventory.write", { entityType: "RentalUnit", entityId: productId });
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't add the unit." };
  }
}

export async function toggleRentalUnit(id: string): Promise<AdminActionResult> {
  await requirePermission("inventory.write");
  try {
    const unit = await prisma.rentalUnit.findUnique({ where: { id }, select: { isActive: true } });
    if (!unit) return { ok: false, error: "Unit not found." };
    await prisma.rentalUnit.update({ where: { id }, data: { isActive: !unit.isActive } });
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the unit." };
  }
}
