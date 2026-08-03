import { requirePermission } from "@/lib/admin-auth";
import { getAllSettings } from "@/server/data/admin-cms";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, Reveal } from "@/components/admin/admin-ui";
import {
  SettingsForm,
  type SettingsValues,
} from "@/components/admin/settings-form";

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
    contactStreet: contact.streetAddress ?? "",
    contactCity: contact.addressLocality ?? "",
    contactState: contact.addressRegion ?? "",
    contactZip: contact.postalCode ?? "",
    contactCountry: contact.addressCountry ?? "US",
    hoursMonFri: hours.mon_fri ?? "",
    hoursSat: hours.sat ?? "",
    hoursSun: hours.sun ?? "",
    deliveryBase: money(fees.deliveryBaseCents),
    pickup: money(fees.pickupCents),
    perMile: money(fees.perMileCents),
    freeRadius:
      fees.freeRadiusMiles != null ? String(fees.freeRadiusMiles) : "",
    instagram: social.instagram ?? "",
    facebook: social.facebook ?? "",
    tiktok: social.tiktok ?? "",
    reviewsUrl: social.reviewsUrl ?? "",
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governance"
        title="Settings"
        description="Contact info, hours, fees, and social links."
      />
      <Link
        href="/admin/settings/payments"
        className="border-border hover:border-primary hover:text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
      >
        <CreditCard className="size-4" /> Payment methods (Zelle, Cash App, …)
      </Link>
      <Reveal delay={0.05}>
        <AdminCard className="p-5 sm:p-6">
          <SettingsForm defaults={defaults} />
        </AdminCard>
      </Reveal>
    </div>
  );
}
