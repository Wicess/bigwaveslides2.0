import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getBlogTaxonomy } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TaxonomyManager, type TaxItem } from "@/components/admin/taxonomy-manager";

export default async function AdminBlogTaxonomy() {
  await requirePermission("blog.write");
  const { categories, tags, authors } = await getBlogTaxonomy();

  const groups = {
    category: categories.map(
      (c): TaxItem => ({
        id: c.id,
        nameEn: getLocalized(c.name, "en"),
        nameFr: getLocalized(c.name, "fr"),
        slug: c.slug,
      }),
    ),
    tag: tags.map(
      (t): TaxItem => ({
        id: t.id,
        nameEn: getLocalized(t.name, "en"),
        nameFr: getLocalized(t.name, "fr"),
        slug: t.slug,
      }),
    ),
    author: authors.map((a): TaxItem => ({ id: a.id, nameEn: a.name })),
  };

  return (
    <div>
      <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Blog
      </Link>
      <AdminPageHeader
        title="Blog taxonomy"
        description="Create, edit and delete categories, tags, and authors."
      />
      <TaxonomyManager groups={groups} />
    </div>
  );
}
