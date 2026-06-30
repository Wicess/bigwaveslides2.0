import { requirePermission } from "@/lib/admin-auth";
import { getAdminCategoriesList } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BackLink, Reveal } from "@/components/admin/admin-ui";
import { CategoryManager, type CategoryItem } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

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
      <BackLink href="/admin/products">Products</BackLink>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Categories"
        description="Create, edit and delete catalog categories."
      />
      <Reveal delay={0.05}>
        <CategoryManager categories={items} />
      </Reveal>
    </div>
  );
}
