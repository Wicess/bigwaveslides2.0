import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getBlogTaxonomy } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TaxonomyForm } from "@/components/admin/taxonomy-form";

export default async function AdminBlogTaxonomy() {
  await requirePermission("blog.write");
  const { categories, tags, authors } = await getBlogTaxonomy();

  return (
    <div>
      <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Blog
      </Link>
      <AdminPageHeader title="Blog taxonomy" description="Categories, tags, and authors." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <TaxGroup title="Categories" items={categories.map((c) => ({ id: c.id, label: getLocalized(c.name, "en"), slug: c.slug }))} />
          <TaxGroup title="Tags" items={tags.map((t) => ({ id: t.id, label: getLocalized(t.name, "en"), slug: t.slug }))} />
          <TaxGroup title="Authors" items={authors.map((a) => ({ id: a.id, label: a.name }))} />
        </div>
        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">Add</h2>
          <TaxonomyForm />
        </Card>
      </div>
    </div>
  );
}

function TaxGroup({ title, items }: { title: string; items: { id: string; label: string; slug?: string }[] }) {
  return (
    <Card className="p-5">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((i) => (
            <span key={i.id} className="rounded-full border border-border px-3 py-1 text-sm">
              {i.label}
              {i.slug ? <span className="ml-1 font-mono text-xs text-muted-foreground">/{i.slug}</span> : null}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
