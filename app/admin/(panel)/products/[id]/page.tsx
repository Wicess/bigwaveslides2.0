import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminProduct, getCategoryOptions } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

type Props = { params: Promise<{ id: string }> };

const dollars = (cents: number | null) => (cents != null ? String(cents / 100) : "");

export default async function AdminEditProduct({ params }: Props) {
  await requirePermission("product.write");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getCategoryOptions(),
  ]);
  if (!product) notFound();

  const name = (product.name as { en?: string; fr?: string }) ?? {};
  const short = (product.shortDescription as { en?: string; fr?: string }) ?? {};
  const desc = (product.description as { en?: string; fr?: string }) ?? {};

  const defaults: ProductFormValues = {
    id: product.id,
    nameEn: name.en ?? "",
    nameFr: name.fr ?? "",
    slug: product.slug,
    sku: product.sku,
    type: product.type,
    status: product.status,
    salePrice: dollars(product.salePriceCents),
    dailyRate: dollars(product.dailyRateCents),
    deposit: dollars(product.depositCents),
    categoryId: product.categoryId ?? "",
    featured: product.featured,
    shortEn: short.en ?? "",
    shortFr: short.fr ?? "",
    descEn: desc.en ?? "",
    descFr: desc.fr ?? "",
    images: product.media.map((m) => m.url),
  };

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Products
      </Link>
      <AdminPageHeader
        title={getLocalized(product.name, "en")}
        action={<DeleteProductButton id={product.id} />}
      />
      <Card className="p-6">
        <ProductForm
          defaults={defaults}
          categories={categories.map((c) => ({ id: c.id, name: getLocalized(c.name, "en") }))}
        />
      </Card>
    </div>
  );
}
