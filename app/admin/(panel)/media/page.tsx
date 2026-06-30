import { requirePermission } from "@/lib/admin-auth";
import { getAdminMedia } from "@/server/data/admin-cms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Reveal } from "@/components/admin/admin-ui";
import { MediaLibrary } from "@/components/admin/media-library";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requirePermission("media.write");
  const assets = await getAdminMedia();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Media library"
        description="Upload and manage R2-hosted media."
      />
      <Reveal delay={0.05}>
        <MediaLibrary
          initial={assets.map((a) => ({ id: a.id, url: a.url, type: a.type, mimeType: a.mimeType }))}
        />
      </Reveal>
    </div>
  );
}
