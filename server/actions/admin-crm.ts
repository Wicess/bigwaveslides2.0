"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";

export type CrmResult = { ok: boolean; error?: string };

const crmSchema = z.object({
  id: z.string().min(1),
  crmNotes: z.string().max(5000).optional().or(z.literal("")),
  tags: z.string().max(500).optional().or(z.literal("")), // comma-separated
});

export async function updateCustomerCrm(
  input: z.input<typeof crmSchema>,
): Promise<CrmResult> {
  const session = await requirePermission("customer.write");
  const parsed = crmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  const { id, crmNotes, tags } = parsed.data;

  const crmTags = (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    await prisma.customer.update({
      where: { id },
      data: { crmNotes: crmNotes || null, crmTags },
    });
    await logActivity(session.id, "customer.write", {
      entityType: "Customer",
      entityId: id,
      summary: "Updated CRM notes/tags",
    });
    revalidatePath(`/admin/customers/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the customer." };
  }
}

const CONTACT_STATUS = ["NEW", "IN_PROGRESS", "RESOLVED"];

export async function setContactStatus(id: string, status: string): Promise<CrmResult> {
  const session = await requirePermission("contact.manage");
  if (!CONTACT_STATUS.includes(status)) return { ok: false, error: "Invalid status." };
  try {
    await prisma.contactInquiry.update({
      where: { id },
      data: { status: status as "NEW" | "IN_PROGRESS" | "RESOLVED" },
    });
    await logActivity(session.id, "contact.manage", {
      entityType: "ContactInquiry",
      entityId: id,
      summary: `Inquiry ${status}`,
    });
    revalidatePath("/admin/contacts");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the inquiry." };
  }
}

export async function deleteContact(id: string): Promise<CrmResult> {
  const session = await requirePermission("contact.manage");
  try {
    await prisma.contactInquiry.delete({ where: { id } });
    await logActivity(session.id, "contact.delete", {
      entityType: "ContactInquiry",
      entityId: id,
    });
    revalidatePath("/admin/contacts");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete the inquiry." };
  }
}

/* ───────────────── Newsletter ───────────────── */

const SUBSCRIBER_STATUS = ["SUBSCRIBED", "UNSUBSCRIBED"];

export async function setSubscriberStatus(id: string, status: string): Promise<CrmResult> {
  const session = await requirePermission("newsletter.manage");
  if (!SUBSCRIBER_STATUS.includes(status)) return { ok: false, error: "Invalid status." };
  try {
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: { status: status as "SUBSCRIBED" | "UNSUBSCRIBED" },
    });
    await logActivity(session.id, "newsletter.manage", {
      entityType: "NewsletterSubscriber",
      entityId: id,
      summary: `Subscriber ${status}`,
    });
    revalidatePath("/admin/newsletter");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the subscriber." };
  }
}

export async function deleteSubscriber(id: string): Promise<CrmResult> {
  const session = await requirePermission("newsletter.manage");
  try {
    await prisma.newsletterSubscriber.delete({ where: { id } });
    await logActivity(session.id, "newsletter.delete", {
      entityType: "NewsletterSubscriber",
      entityId: id,
    });
    revalidatePath("/admin/newsletter");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete the subscriber." };
  }
}
