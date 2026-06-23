import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminPost, getBlogTaxonomy } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PostForm, type PostFormValues } from "@/components/admin/post-form";

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
      <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Blog
      </Link>
      <AdminPageHeader title={getLocalized(post.title, "en")} />
      <Card className="p-6">
        <PostForm
          defaults={defaults}
          authors={taxonomy.authors}
          categories={taxonomy.categories.map((c) => ({ id: c.id, name: getLocalized(c.name, "en") }))}
        />
      </Card>
    </div>
  );
}
