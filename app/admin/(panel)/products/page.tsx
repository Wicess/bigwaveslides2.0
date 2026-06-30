import Link from "next/link";
import { Plus, Tags, Package, Eye, Boxes } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminProducts } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminCard,
  CountPill,
  EmptyState,
  IconChip,
  Reveal,
  Th,
  Toolbar,
} from "@/components/admin/admin-ui";
import { FilterSelect } from "@/components/admin/list-controls";
import { DropdownMenu, DropdownLink } from "@/components/admin/dropdown-menu";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ type?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  await requirePermission("product.read");
  const { type } = await searchParams;
  const all = await getAdminProducts();
  const products = all.filter((p) => !type || p.type === type);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Products"
        description="Your sale and rental catalog."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/products/categories">
                <Tags className="size-4" /> Categories
              </Link>
            </Button>
            <Button asChild size="sm" variant="gradient">
              <Link href="/admin/products/new">
                <Plus className="size-4" /> New product
              </Link>
            </Button>
          </div>
        }
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Catalog</h2>
          <CountPill>{products.length}</CountPill>
        </div>
        <FilterSelect
          name="type"
          placeholder="All types"
          className="w-full sm:w-44"
          options={[
            { value: "SALE", label: "For sale" },
            { value: "RENTAL", label: "For rent" },
          ]}
        />
      </Toolbar>

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products yet"
              hint="Add your first slide, bounce house or combo to the catalog."
              action={
                <Button asChild size="sm" variant="gradient">
                  <Link href="/admin/products/new">
                    <Plus className="size-4" /> New product
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <Th>Product</Th>
                      <Th>SKU</Th>
                      <Th>Type</Th>
                      <Th>Price</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {products.map((p) => {
                      const price = p.type === "SALE" ? p.salePriceCents : p.dailyRateCents;
                      return (
                        <tr key={p.id} className="group transition-colors hover:bg-primary-50/40">
                          <td className="px-5 py-3.5">
                            <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                              <IconChip icon={Package} />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2">
                                  <span className="truncate font-semibold text-foreground group-hover:text-primary">
                                    {getLocalized(p.name, "en")}
                                  </span>
                                  {p.featured ? (
                                    <Badge variant="secondary">Featured</Badge>
                                  ) : null}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {p.category?.name
                                    ? getLocalized(p.category.name, "en")
                                    : "Uncategorized"}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                            {p.sku}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                              {p.type === "SALE" ? "Sale" : "Rental"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-foreground">
                            {price != null ? formatPrice(price, "en") : "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusDot status={p.status} />
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownLink href={`/admin/products/${p.id}`}>
                                  <Eye className="size-4" /> Edit product
                                </DropdownLink>
                                {p.type === "RENTAL" ? (
                                  <DropdownLink href="/admin/inventory">
                                    <Boxes className="size-4" /> Manage units
                                  </DropdownLink>
                                ) : null}
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-border/70 md:hidden">
                {products.map((p) => {
                  const price = p.type === "SALE" ? p.salePriceCents : p.dailyRateCents;
                  return (
                    <li key={p.id}>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 p-4 active:bg-primary-50/40">
                        <IconChip icon={Package} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-semibold text-foreground">
                              {getLocalized(p.name, "en")}
                            </span>
                            {p.featured ? <Badge variant="secondary">Featured</Badge> : null}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.category?.name ? getLocalized(p.category.name, "en") : "Uncategorized"} ·{" "}
                            {p.sku}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-bold text-foreground">
                            {price != null ? formatPrice(price, "en") : "—"}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {p.type === "SALE" ? "Sale" : "Rental"} · {p.status}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </AdminCard>
      </Reveal>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const live = status === "ACTIVE" || status === "PUBLISHED";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
      <span
        className={`size-2 rounded-full ${live ? "bg-green-500" : "bg-muted-foreground/40"}`}
      />
      {status}
    </span>
  );
}
