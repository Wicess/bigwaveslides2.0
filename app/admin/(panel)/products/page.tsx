import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminProducts } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminProductsPage() {
  await requirePermission("product.read");
  const products = await getAdminProducts();

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Sale and rental catalog."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/products/categories"><Tags className="size-4" /> Categories</Link>
            </Button>
            <Button asChild size="sm" variant="gradient">
              <Link href="/admin/products/new"><Plus className="size-4" /> New product</Link>
            </Button>
          </div>
        }
      />
      <Card className="overflow-hidden">
        {products.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => {
                  const price = p.type === "SALE" ? p.salePriceCents : p.dailyRateCents;
                  return (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${p.id}`} className="font-semibold text-primary">
                          {getLocalized(p.name, "en")}
                        </Link>
                        {p.featured ? <Badge variant="secondary" className="ml-2">Featured</Badge> : null}
                        <span className="block text-xs text-muted-foreground">
                          {p.category?.name ? getLocalized(p.category.name, "en") : "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                      <td className="px-4 py-3 font-semibold">
                        {price != null ? formatPrice(price, "en") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
