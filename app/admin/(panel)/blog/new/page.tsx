import { requirePermission } from "@/lib/admin-auth";
import { getBlogTaxonomy } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, BackLink, Reveal } from "@/components/admin/admin-ui";
import { PostForm, type PostFormValues } from "@/components/admin/post-form";

export default async function AdminNewPost() {
  await requirePermission("blog.write");
  const { categories, authors } = await getBlogTaxonomy();

  const defaults: PostFormValues = {
    titleEn: "", titleFr: "", slug: "",
    excerptEn: "", excerptFr: "", contentEn: "", contentFr: "",
    coverImage: "", status: "DRAFT", readingMinutes: "4",
    featured: false, authorId: "", categoryId: "",
  };

  return (
    <div>
      <BackLink href="/admin/blog">Blog</BackLink>
      <AdminPageHeader eyebrow="Content" title="New post" description="Write a new article or guide." />
      <Reveal delay={0.05}>
        <AdminCard className="p-6 sm:p-8">
          <PostForm
            defaults={defaults}
            authors={authors}
            categories={categories.map((c) => ({ id: c.id, name: getLocalized(c.name, "en") }))}
          />
        </AdminCard>
      </Reveal>
    </div>
  );
}
