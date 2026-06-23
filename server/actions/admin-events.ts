"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";

export type AdminActionResult = { ok: boolean; error?: string; id?: string };

const schema = z.object({
  id: z.string().optional(),
  titleEn: z.string().min(2).max(200),
  titleFr: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens"),
  excerptEn: z.string().max(400).optional().or(z.literal("")),
  excerptFr: z.string().max(400).optional().or(z.literal("")),
  descEn: z.string().max(8000).optional().or(z.literal("")),
  descFr: z.string().max(8000).optional().or(z.literal("")),
  status: z.enum(["UPCOMING", "ONGOING", "PAST", "CANCELLED"]),
  startAt: z.string().min(1, "Start date required"),
  endAt: z.string().optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  coverImage: z.string().max(500).optional().or(z.literal("")),
  capacity: z.string().optional(),
  registrationEnabled: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export async function saveEvent(
  input: z.input<typeof schema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("event.write");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }
  const d = parsed.data;

  const start = new Date(d.startAt);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Invalid start date." };
  const end = d.endAt ? new Date(d.endAt) : null;

  const data = {
    title: { en: d.titleEn, fr: d.titleFr },
    slug: d.slug,
    excerpt: { en: d.excerptEn ?? "", fr: d.excerptFr ?? "" },
    description: { en: d.descEn ?? "", fr: d.descFr ?? "" },
    status: d.status,
    startAt: start,
    endAt: end && !Number.isNaN(end.getTime()) ? end : null,
    location: d.location || null,
    coverImage: d.coverImage || null,
    capacity: d.capacity ? Number(d.capacity) || null : null,
    registrationEnabled: d.registrationEnabled ?? false,
    featured: d.featured ?? false,
  };

  try {
    let id = d.id;
    if (id) await prisma.event.update({ where: { id }, data });
    else {
      const created = await prisma.event.create({ data, select: { id: true } });
      id = created.id;
    }
    await logActivity(session.id, d.id ? "event.update" : "event.create", {
      entityType: "Event",
      entityId: id,
      summary: `${d.id ? "Updated" : "Created"} event ${d.titleEn}`,
    });
    revalidatePath("/admin/events");
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't save the event (slug may be in use)." };
  }
}

export async function deleteEvent(id: string): Promise<AdminActionResult> {
  const session = await requirePermission("event.write");
  try {
    await prisma.event.delete({ where: { id } });
    await logActivity(session.id, "event.delete", { entityType: "Event", entityId: id });
    revalidatePath("/admin/events");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete the event." };
  }
}
