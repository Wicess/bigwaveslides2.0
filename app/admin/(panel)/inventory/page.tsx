import { Boxes } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminInventory } from "@/server/data/admin";
import { getLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InventoryManager } from "@/components/admin/inventory-manager";
import {
  AdminCard,
  EmptyState,
  IconChip,
  Reveal,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requirePermission("inventory.write");
  const products = await getAdminInventory();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Inventory"
        description="Rental units per product. Active units are bookable; toggle to take one out of service."
      />

      {products.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={Boxes}
            title="No rentable products yet"
            hint="Create a rental product to manage its units here."
          />
        </AdminCard>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {products.map((p, i) => {
            const total = p.rentalUnits.length;
            const active = p.rentalUnits.filter((u) => u.isActive).length;
            const pct = total ? Math.round((active / total) * 100) : 0;
            return (
              <Reveal key={p.id} delay={Math.min(i * 0.05, 0.3)}>
                <AdminCard className="h-full p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <IconChip icon={Boxes} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-foreground truncate text-base font-bold">
                        {getLocalized(p.name, "en")}
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        {active} of {total} units active
                      </p>
                    </div>
                    <span className="font-display text-primary text-lg font-bold">
                      {pct}%
                    </span>
                  </div>
                  <div className="bg-muted mb-4 h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full [background:var(--gradient-wave)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <InventoryManager
                    productId={p.id}
                    units={p.rentalUnits.map((u) => ({
                      id: u.id,
                      unitLabel: u.unitLabel,
                      isActive: u.isActive,
                    }))}
                  />
                </AdminCard>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
