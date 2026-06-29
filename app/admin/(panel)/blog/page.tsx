import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminPosts } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminBlogPage() {
  await requirePermission("blog.write");
  const posts = await getAdminPosts();

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        description="Articles, guides, and news."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/blog/taxonomy"><Tags className="size-4" /> Taxonomy</Link>
            </Button>
            <Button asChild size="sm" variant="gradient">
              <Link href="/admin/blog/new"><Plus className="size-4" /> New post</Link>
            </Button>
          </div>
        }
      />
      <Card className="overflow-hidden">
        {posts.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Published</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/admin/blog/${p.id}`} className="font-semibold text-primary">
                          {getLocalized(p.title, "en")}
                        </Link>
                        {p.featured ? <Badge variant="secondary" className="ml-2">Featured</Badge> : null}
                        <span className="block text-xs text-muted-foreground">
                          {p.category?.name ? getLocalized(p.category.name, "en") : "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.author?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.status}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.publishedAt ? formatDate(p.publishedAt, "en") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/blog/${p.id}`} className="block p-4 active:bg-muted/40">
                    <span className="block font-semibold text-primary">
                      {getLocalized(p.title, "en")}
                      {p.featured ? <Badge variant="secondary" className="ml-2">Featured</Badge> : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {p.category?.name ? getLocalized(p.category.name, "en") : "Uncategorized"} · {p.author?.name ?? "—"}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {p.status} · {p.publishedAt ? formatDate(p.publishedAt, "en") : "Draft"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
