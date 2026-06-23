import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getBlogTaxonomy } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
      <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Blog
      </Link>
      <AdminPageHeader title="New post" />
      <Card className="p-6">
        <PostForm
          defaults={defaults}
          authors={authors}
          categories={categories.map((c) => ({ id: c.id, name: getLocalized(c.name, "en") }))}
        />
      </Card>
    </div>
  );
}
