import { requirePermission } from "@/lib/admin-auth";
import { getAllSettings } from "@/server/data/admin-cms";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SettingsForm, type SettingsValues } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  await requirePermission("settings.write");
  const s = await getAllSettings();

  const contact = (s.contact as Record<string, string>) ?? {};
  const hours = (s.hours as Record<string, string>) ?? {};
  const fees = (s.fees as Record<string, number>) ?? {};
  const social = (s.social as Record<string, string>) ?? {};
  const money = (c?: number) => (c != null ? String(c / 100) : "");

  const defaults: SettingsValues = {
    contactEmail: contact.email ?? "",
    contactPhone: contact.phone ?? "",
    contactWhatsapp: contact.whatsapp ?? "",
    contactAddress: contact.address ?? "",
    hoursMonFri: hours.mon_fri ?? "",
    hoursSat: hours.sat ?? "",
    hoursSun: hours.sun ?? "",
    deliveryBase: money(fees.deliveryBaseCents),
    pickup: money(fees.pickupCents),
    perMile: money(fees.perMileCents),
    freeRadius: fees.freeRadiusMiles != null ? String(fees.freeRadiusMiles) : "",
    instagram: social.instagram ?? "",
    facebook: social.facebook ?? "",
    tiktok: social.tiktok ?? "",
  };

  return (
    <div>
      <AdminPageHeader title="Settings" description="Contact info, hours, fees, and social links." />
      <Card className="p-6">
        <SettingsForm defaults={defaults} />
      </Card>
    </div>
  );
}
