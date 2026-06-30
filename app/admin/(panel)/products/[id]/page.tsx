import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminProduct, getCategoryOptions } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, BackLink, Reveal } from "@/components/admin/admin-ui";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export const dynamic = "force-dynamic";

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
  const dims = (product.dimensions as { size?: string; weight?: string } | null) ?? {};
  const space = (product.spaceRequired as { value?: string } | null) ?? {};
  // Features are stored as an array of { en, fr } (or plain strings); split back
  // into newline-separated EN/FR text for the form.
  const featureList = Array.isArray(product.features)
    ? (product.features as unknown[])
    : [];
  const featuresEn = featureList
    .map((f) => (typeof f === "string" ? f : ((f as { en?: string })?.en ?? "")))
    .join("\n");
  const featuresFr = featureList
    .map((f) => (typeof f === "string" ? f : ((f as { fr?: string })?.fr ?? "")))
    .join("\n");

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
    capacity: product.capacity != null ? String(product.capacity) : "",
    ageRange: product.ageRange ?? "",
    dimensions: dims.size ?? "",
    weight: dims.weight ?? "",
    powerRequired: product.powerRequired ?? "",
    setupArea: space.value ?? "",
    featuresEn,
    featuresFr,
    images: product.media.map((m) => m.url),
  };

  return (
    <div>
      <BackLink href="/admin/products">Products</BackLink>
      <AdminPageHeader
        eyebrow="Edit product"
        title={getLocalized(product.name, "en")}
        action={<DeleteProductButton id={product.id} />}
      />
      <Reveal delay={0.05}>
        <AdminCard className="p-6 sm:p-8">
          <ProductForm
            defaults={defaults}
            categories={categories.map((c) => ({ id: c.id, name: getLocalized(c.name, "en") }))}
          />
        </AdminCard>
      </Reveal>
    </div>
  );
}
