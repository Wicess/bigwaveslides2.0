import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EventForm, type EventFormValues } from "@/components/admin/event-form";

export default async function AdminNewEvent() {
  await requirePermission("event.write");

  const defaults: EventFormValues = {
    titleEn: "", titleFr: "", slug: "",
    excerptEn: "", excerptFr: "", descEn: "", descFr: "",
    status: "UPCOMING", startAt: "", endAt: "",
    location: "", coverImage: "", capacity: "",
    registrationEnabled: false, featured: false,
  };

  return (
    <div>
      <Link href="/admin/events" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Events
      </Link>
      <AdminPageHeader title="New event" />
      <Card className="p-6">
        <EventForm defaults={defaults} />
      </Card>
    </div>
  );
}
