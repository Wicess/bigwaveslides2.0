"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";
import { r2DeleteObject } from "@/lib/r2";

export type AdminActionResult = { ok: boolean; error?: string };

/* ───────────────── Settings ───────────────── */

const settingsSchema = z.object({
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
  contactWhatsapp: z.string().max(40).optional().or(z.literal("")),
  contactAddress: z.string().max(300).optional().or(z.literal("")),
  hoursMonFri: z.string().max(60).optional().or(z.literal("")),
  hoursSat: z.string().max(60).optional().or(z.literal("")),
  hoursSun: z.string().max(60).optional().or(z.literal("")),
  deliveryBase: z.string().optional(),
  pickup: z.string().optional(),
  perMile: z.string().optional(),
  freeRadius: z.string().optional(),
  instagram: z.string().max(200).optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  tiktok: z.string().max(200).optional().or(z.literal("")),
});

const cents = (v?: string) => (v && v.trim() !== "" ? Math.round(Number(v) * 100) : undefined);
const int = (v?: string) => (v && v.trim() !== "" ? Number(v) : undefined);

export async function saveSettings(
  input: z.input<typeof settingsSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("settings.write");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  const d = parsed.data;

  const groups: { key: string; group: string; value: unknown }[] = [
    {
      key: "contact",
      group: "contact",
      value: {
        email: d.contactEmail || "",
        phone: d.contactPhone || "",
        whatsapp: d.contactWhatsapp || "",
        address: d.contactAddress || "",
      },
    },
    {
      key: "hours",
      group: "general",
      value: { mon_fri: d.hoursMonFri || "", sat: d.hoursSat || "", sun: d.hoursSun || "" },
    },
    {
      key: "fees",
      group: "fees",
      value: {
        deliveryBaseCents: cents(d.deliveryBase) ?? 0,
        pickupCents: cents(d.pickup) ?? 0,
        perMileCents: cents(d.perMile) ?? 0,
        freeRadiusMiles: int(d.freeRadius) ?? 0,
      },
    },
    {
      key: "social",
      group: "general",
      value: { instagram: d.instagram || "", facebook: d.facebook || "", tiktok: d.tiktok || "" },
    },
  ];

  try {
    for (const g of groups) {
      await prisma.siteSetting.upsert({
        where: { key: g.key },
        update: { value: g.value as object, group: g.group },
        create: { key: g.key, value: g.value as object, group: g.group },
      });
    }
    await logActivity(session.id, "settings.write", { summary: "Updated site settings" });
    revalidateTag("settings");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save settings." };
  }
}

/* ───────────────── Media ───────────────── */

export async function deleteMedia(id: string): Promise<AdminActionResult> {
  const session = await requirePermission("media.write");
  try {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
      select: { r2Key: true },
    });
    if (asset?.r2Key) {
      await r2DeleteObject(asset.r2Key).catch(() => {});
    }
    await prisma.mediaAsset.delete({ where: { id } });
    await logActivity(session.id, "media.delete", { entityType: "MediaAsset", entityId: id });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete the asset." };
  }
}

/* ───────────────── Admin users ───────────────── */

const userSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters"),
  roleId: z.string().optional(),
});

export async function createAdminUser(
  input: z.input<typeof userSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("users.manage");
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }
  const { name, email, password, roleId } = parsed.data;
  try {
    const exists = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (exists) return { ok: false, error: "That email is already in use." };

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.create({
      data: { name, email: email.toLowerCase(), passwordHash, roleId: roleId || null },
    });
    await logActivity(session.id, "users.create", { summary: `Created admin ${email}` });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't create the user." };
  }
}

export async function toggleAdminUser(id: string): Promise<AdminActionResult> {
  const session = await requirePermission("users.manage");
  if (id === session.id) return { ok: false, error: "You can't deactivate yourself." };
  try {
    const user = await prisma.adminUser.findUnique({ where: { id }, select: { isActive: true } });
    if (!user) return { ok: false, error: "Not found." };
    await prisma.adminUser.update({ where: { id }, data: { isActive: !user.isActive } });
    await logActivity(session.id, "users.toggle", { entityType: "AdminUser", entityId: id });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the user." };
  }
}
