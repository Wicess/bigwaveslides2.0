import { requirePermission } from "@/lib/admin-auth";
import { getCategoryOptions } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, BackLink, Reveal } from "@/components/admin/admin-ui";
import {
  ProductForm,
  type ProductFormValues,
} from "@/components/admin/product-form";

export default async function AdminNewProduct() {
  await requirePermission("product.write");
  const categories = await getCategoryOptions();

  const defaults: ProductFormValues = {
    nameEn: "",
    slug: "",
    sku: "",
    type: "RENTAL",
    status: "DRAFT",
    salePrice: "",
    dailyRate: "",
    deposit: "",
    categoryId: "",
    featured: false,
    shortEn: "",
    shortFr: "",
    descEn: "",
    descFr: "",
    capacity: "",
    ageRange: "",
    dimensions: "",
    weight: "",
    powerRequired: "",
    setupArea: "",
    featuresEn: "",
    featuresFr: "",
    images: [],
  };

  return (
    <div>
      <BackLink href="/admin/products">Products</BackLink>
      <AdminPageHeader
        eyebrow="Commerce"
        title="New product"
        description="Add a slide, bounce house or combo to the catalog."
      />
      <Reveal delay={0.05}>
        <AdminCard className="p-6 sm:p-8">
          <ProductForm
            defaults={defaults}
            categories={categories.map((c) => ({
              id: c.id,
              name: getLocalized(c.name, "en"),
            }))}
          />
        </AdminCard>
      </Reveal>
    </div>
  );
}
