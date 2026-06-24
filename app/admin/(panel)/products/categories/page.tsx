import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminCategoriesList } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryManager, type CategoryItem } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  await requirePermission("category.write");
  const categories = await getAdminCategoriesList();

  const items: CategoryItem[] = categories.map((c) => ({
    id: c.id,
    nameEn: getLocalized(c.name, "en"),
    nameFr: getLocalized(c.name, "fr"),
    slug: c.slug,
    order: c.order,
    productCount: c._count.products,
  }));

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Products
      </Link>
      <AdminPageHeader title="Categories" description="Create, edit and delete catalog categories." />
      <CategoryManager categories={items} />
    </div>
  );
}
