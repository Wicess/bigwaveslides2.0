import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminPost, getBlogTaxonomy } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, BackLink, Reveal } from "@/components/admin/admin-ui";
import { PostForm, type PostFormValues } from "@/components/admin/post-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditPost({ params }: Props) {
  await requirePermission("blog.write");
  const { id } = await params;
  const [post, taxonomy] = await Promise.all([getAdminPost(id), getBlogTaxonomy()]);
  if (!post) notFound();

  const title = (post.title as { en?: string; fr?: string }) ?? {};
  const excerpt = (post.excerpt as { en?: string; fr?: string }) ?? {};
  const content = (post.content as { en?: string; fr?: string }) ?? {};

  const defaults: PostFormValues = {
    id: post.id,
    titleEn: title.en ?? "",
    titleFr: title.fr ?? "",
    slug: post.slug,
    excerptEn: excerpt.en ?? "",
    excerptFr: excerpt.fr ?? "",
    contentEn: content.en ?? "",
    contentFr: content.fr ?? "",
    coverImage: post.coverImage ?? "",
    status: post.status,
    readingMinutes: String(post.readingMinutes),
    featured: post.featured,
    authorId: post.authorId ?? "",
    categoryId: post.categoryId ?? "",
  };

  return (
    <div>
      <BackLink href="/admin/blog">Blog</BackLink>
      <AdminPageHeader eyebrow="Edit post" title={getLocalized(post.title, "en")} />
      <Reveal delay={0.05}>
        <AdminCard className="p-6 sm:p-8">
          <PostForm
            defaults={defaults}
            authors={taxonomy.authors}
            categories={taxonomy.categories.map((c) => ({ id: c.id, name: getLocalized(c.name, "en") }))}
          />
        </AdminCard>
      </Reveal>
    </div>
  );
}
