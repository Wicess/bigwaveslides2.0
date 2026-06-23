import { requirePermission } from "@/lib/admin-auth";
import { getAdminInventory } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InventoryManager } from "@/components/admin/inventory-manager";

export default async function AdminInventoryPage() {
  await requirePermission("inventory.write");
  const products = await getAdminInventory();

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Rental units per product. Active units are bookable; toggle to take one out of service."
      />
      {products.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No rentable products yet.
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const active = p.rentalUnits.filter((u) => u.isActive).length;
            return (
              <Card key={p.id} className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{getLocalized(p.name, "en")}</h2>
                  <span className="text-xs text-muted-foreground">
                    {active} / {p.rentalUnits.length} active
                  </span>
                </div>
                <InventoryManager
                  productId={p.id}
                  units={p.rentalUnits.map((u) => ({
                    id: u.id,
                    unitLabel: u.unitLabel,
                    isActive: u.isActive,
                  }))}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
