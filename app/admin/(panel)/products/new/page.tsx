import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getCategoryOptions } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";

export default async function AdminNewProduct() {
  await requirePermission("product.write");
  const categories = await getCategoryOptions();

  const defaults: ProductFormValues = {
    nameEn: "", nameFr: "", slug: "", sku: "",
    type: "RENTAL", status: "DRAFT",
    salePrice: "", dailyRate: "", deposit: "",
    categoryId: "", featured: false,
    shortEn: "", shortFr: "", descEn: "", descFr: "",
    images: [],
  };

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Products
      </Link>
      <AdminPageHeader title="New product" />
      <Card className="p-6">
        <ProductForm
          defaults={defaults}
          categories={categories.map((c) => ({ id: c.id, name: getLocalized(c.name, "en") }))}
        />
      </Card>
    </div>
  );
}
