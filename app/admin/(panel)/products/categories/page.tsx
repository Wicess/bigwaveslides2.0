import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminCategoriesList } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";

export default async function AdminCategoriesPage() {
  await requirePermission("category.write");
  const categories = await getAdminCategoriesList();

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Products
      </Link>
      <AdminPageHeader title="Categories" description="Organize the product catalog." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          {categories.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium">{getLocalized(c.name, "en")}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">/{c.slug}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{c._count.products} products</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">Add category</h2>
          <CategoryForm />
        </Card>
      </div>
    </div>
  );
}
