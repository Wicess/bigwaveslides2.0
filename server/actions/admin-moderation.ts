"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";

export type ModResult = { ok: boolean; error?: string };

const REVIEW_STATUS = ["PENDING", "APPROVED", "REJECTED"];

/** Approve/reject a review and recompute the product's rating aggregate. */
export async function setReviewStatus(id: string, status: string): Promise<ModResult> {
  const session = await requirePermission("review.moderate");
  if (!REVIEW_STATUS.includes(status)) return { ok: false, error: "Invalid status." };

  try {
    const review = await prisma.review.update({
      where: { id },
      data: { status: status as "PENDING" | "APPROVED" | "REJECTED" },
      select: { productId: true },
    });

    // Recompute rating average/count from APPROVED reviews.
    const agg = await prisma.review.aggregate({
      where: { productId: review.productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: review.productId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });

    await logActivity(session.id, "review.moderate", {
      entityType: "Review",
      entityId: id,
      summary: `Review ${status}`,
    });
    revalidateTag("products");
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the review." };
  }
}

export async function deleteReview(id: string): Promise<ModResult> {
  const session = await requirePermission("review.moderate");
  try {
    const review = await prisma.review.delete({
      where: { id },
      select: { productId: true },
    });
    const agg = await prisma.review.aggregate({
      where: { productId: review.productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: review.productId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
    await logActivity(session.id, "review.delete", { entityType: "Review", entityId: id });
    revalidateTag("products");
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete the review." };
  }
}

const TESTIMONIAL_STATUS = ["PENDING", "APPROVED", "REJECTED"];

export async function setTestimonialStatus(id: string, status: string): Promise<ModResult> {
  const session = await requirePermission("testimonial.moderate");
  if (!TESTIMONIAL_STATUS.includes(status)) return { ok: false, error: "Invalid status." };
  try {
    await prisma.testimonial.update({
      where: { id },
      data: { status: status as "PENDING" | "APPROVED" | "REJECTED" },
    });
    await logActivity(session.id, "testimonial.moderate", {
      entityType: "Testimonial",
      entityId: id,
      summary: `Testimonial ${status}`,
    });
    revalidateTag("testimonials");
    revalidatePath("/admin/testimonials");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the testimonial." };
  }
}

export async function toggleTestimonialFeatured(id: string): Promise<ModResult> {
  await requirePermission("testimonial.moderate");
  try {
    const t = await prisma.testimonial.findUnique({
      where: { id },
      select: { featured: true },
    });
    if (!t) return { ok: false, error: "Not found." };
    await prisma.testimonial.update({ where: { id }, data: { featured: !t.featured } });
    revalidateTag("testimonials");
    revalidatePath("/admin/testimonials");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update." };
  }
}
