"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/admin-auth";

export type AdminActionResult = { ok: boolean; error?: string; id?: string };

const postSchema = z.object({
  id: z.string().optional(),
  titleEn: z.string().min(2).max(200),
  titleFr: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens"),
  excerptEn: z.string().max(400).optional().or(z.literal("")),
  excerptFr: z.string().max(400).optional().or(z.literal("")),
  contentEn: z.string().max(20000).optional().or(z.literal("")),
  contentFr: z.string().max(20000).optional().or(z.literal("")),
  coverImage: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  readingMinutes: z.string().optional(),
  featured: z.boolean().optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
});

export async function savePost(
  input: z.input<typeof postSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("blog.write");
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }
  const d = parsed.data;

  // Publishing requires the publish permission.
  if (d.status === "PUBLISHED") {
    await requirePermission("blog.publish");
  }

  const data = {
    title: { en: d.titleEn, fr: d.titleFr },
    slug: d.slug,
    excerpt: { en: d.excerptEn ?? "", fr: d.excerptFr ?? "" },
    content: { en: d.contentEn ?? "", fr: d.contentFr ?? "" },
    coverImage: d.coverImage || null,
    status: d.status,
    readingMinutes: d.readingMinutes ? Number(d.readingMinutes) || 3 : 3,
    featured: d.featured ?? false,
    authorId: d.authorId || null,
    categoryId: d.categoryId || null,
    ...(d.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
  };

  try {
    let id = d.id;
    if (id) await prisma.blogPost.update({ where: { id }, data });
    else {
      const created = await prisma.blogPost.create({ data, select: { id: true } });
      id = created.id;
    }
    await logActivity(session.id, d.id ? "blog.update" : "blog.create", {
      entityType: "BlogPost",
      entityId: id,
      summary: `${d.id ? "Updated" : "Created"} post ${d.titleEn}`,
    });
    revalidatePath("/admin/blog");
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't save the post (slug may be in use)." };
  }
}

export async function deletePost(id: string): Promise<AdminActionResult> {
  const session = await requirePermission("blog.write");
  try {
    await prisma.blogPost.delete({ where: { id } });
    await logActivity(session.id, "blog.delete", { entityType: "BlogPost", entityId: id });
    revalidatePath("/admin/blog");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete the post." };
  }
}

/* ───────────────── Taxonomy ───────────────── */

const taxonomySchema = z.object({
  kind: z.enum(["category", "tag", "author"]),
  nameEn: z.string().min(1).max(120),
  nameFr: z.string().max(120).optional(),
  slug: z.string().max(120).optional(),
});

export async function saveTaxonomy(
  input: z.input<typeof taxonomySchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("blog.write");
  const parsed = taxonomySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  const { kind, nameEn, nameFr, slug } = parsed.data;
  const safeSlug = (slug || nameEn).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    if (kind === "author") {
      await prisma.author.create({ data: { name: nameEn } });
    } else if (kind === "category") {
      await prisma.blogCategory.create({
        data: { slug: safeSlug, name: { en: nameEn, fr: nameFr || nameEn } },
      });
    } else {
      await prisma.tag.create({
        data: { slug: safeSlug, name: { en: nameEn, fr: nameFr || nameEn } },
      });
    }
    await logActivity(session.id, "blog.taxonomy", { summary: `Added ${kind} ${nameEn}` });
    revalidatePath("/admin/blog/taxonomy");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save (slug may be in use)." };
  }
}
