import Link from "next/link";
import { Plus, Tags, Newspaper, Eye, ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminPosts } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminCard,
  CountPill,
  EmptyState,
  IconChip,
  Reveal,
  Th,
  Toolbar,
} from "@/components/admin/admin-ui";
import { FilterSelect } from "@/components/admin/list-controls";
import { DropdownMenu, DropdownLink } from "@/components/admin/dropdown-menu";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminBlogPage({ searchParams }: Props) {
  await requirePermission("blog.write");
  const { status } = await searchParams;
  const all = await getAdminPosts();
  const posts = all.filter((p) => !status || p.status === status);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Blog"
        description="Articles, guides, and news."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/blog/taxonomy">
                <Tags className="size-4" /> Taxonomy
              </Link>
            </Button>
            <Button asChild size="sm" variant="gradient">
              <Link href="/admin/blog/new">
                <Plus className="size-4" /> New post
              </Link>
            </Button>
          </div>
        }
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">All posts</h2>
          <CountPill>{posts.length}</CountPill>
        </div>
        <FilterSelect
          name="status"
          placeholder="Any status"
          className="w-full sm:w-44"
          options={[
            { value: "PUBLISHED", label: "Published" },
            { value: "DRAFT", label: "Draft" },
          ]}
        />
      </Toolbar>

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {posts.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="No posts yet"
              hint="Write your first article to start the blog."
              action={
                <Button asChild size="sm" variant="gradient">
                  <Link href="/admin/blog/new">
                    <Plus className="size-4" /> New post
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-border bg-muted/50 border-b">
                    <tr>
                      <Th>Title</Th>
                      <Th>Author</Th>
                      <Th>Status</Th>
                      <Th>Published</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/70 divide-y">
                    {posts.map((p) => {
                      const live = p.status === "PUBLISHED";
                      return (
                        <tr
                          key={p.id}
                          className="group hover:bg-primary-50/40 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/admin/blog/${p.id}`}
                              className="flex items-center gap-3"
                            >
                              <IconChip icon={Newspaper} />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2">
                                  <span className="text-foreground group-hover:text-primary truncate font-semibold">
                                    {getLocalized(p.title, "en")}
                                  </span>
                                  {p.featured ? (
                                    <Badge variant="secondary">Featured</Badge>
                                  ) : null}
                                </span>
                                <span className="text-muted-foreground block truncate text-xs">
                                  {p.category?.name
                                    ? getLocalized(p.category.name, "en")
                                    : "Uncategorized"}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="text-muted-foreground px-5 py-3.5">
                            {p.author?.name ?? "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-foreground/70 inline-flex items-center gap-1.5 text-xs font-semibold">
                              <span
                                className={`size-2 rounded-full ${live ? "bg-green-500" : "bg-muted-foreground/40"}`}
                              />
                              {p.status}
                            </span>
                          </td>
                          <td className="text-muted-foreground px-5 py-3.5 whitespace-nowrap">
                            {p.publishedAt
                              ? formatDate(p.publishedAt, "en")
                              : "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownLink href={`/admin/blog/${p.id}`}>
                                  <Eye className="size-4" /> Edit post
                                </DropdownLink>
                                {live && p.slug ? (
                                  <DropdownLink
                                    href={`/blog/${p.slug}`}
                                    target="_blank"
                                  >
                                    <ExternalLink className="size-4" /> View
                                    live
                                  </DropdownLink>
                                ) : null}
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-border/70 divide-y md:hidden">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/blog/${p.id}`}
                      className="active:bg-primary-50/40 flex items-center gap-3 p-4"
                    >
                      <IconChip icon={Newspaper} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-foreground truncate font-semibold">
                            {getLocalized(p.title, "en")}
                          </span>
                          {p.featured ? (
                            <Badge variant="secondary">Featured</Badge>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {p.category?.name
                            ? getLocalized(p.category.name, "en")
                            : "Uncategorized"}{" "}
                          · {p.author?.name ?? "—"}
                        </span>
                        <span className="text-muted-foreground mt-0.5 block text-xs">
                          {p.status} ·{" "}
                          {p.publishedAt
                            ? formatDate(p.publishedAt, "en")
                            : "Draft"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </AdminCard>
      </Reveal>
    </div>
  );
}
