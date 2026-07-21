import { requirePermission } from "@/lib/admin-auth";
import { loadPaymentMethods } from "@/lib/payment-methods";
import { getSettings } from "@/server/data/settings";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, Reveal } from "@/components/admin/admin-ui";
import { PaymentRailsForm } from "@/components/admin/payment-rails-form";
import { TransportToggle } from "@/components/admin/transport-toggle";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsSettingsPage() {
  await requirePermission("settings.write");
  const methods = await loadPaymentMethods();
  const settings = await getSettings().catch(() => ({}) as never);
  const transportOn = settings?.fees?.transportEnabled !== false;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governance"
        title="Payment methods"
        description="Configure the manual payment rails clients can pick on their invoice page. A rail with a destination sends its details automatically the moment a client chooses it; leave the destination empty to assign details per order (you'll get an urgent push when one is needed)."
      />
      <Reveal>
        <AdminCard className="mb-5 p-5">
          <TransportToggle initial={transportOn} />
        </AdminCard>
      </Reveal>
      <Reveal delay={0.05}>
        <AdminCard className="p-6">
          <PaymentRailsForm
            initial={methods.map((m) => ({
              method: m.method,
              label: m.label,
              destination: m.destination,
              instructions: m.instructions,
              network: m.network,
              qrImageUrl: m.qrImageUrl,
              enabled: m.enabled,
            }))}
          />
        </AdminCard>
      </Reveal>
    </div>
  );
}
