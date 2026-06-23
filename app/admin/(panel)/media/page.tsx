import { requirePermission } from "@/lib/admin-auth";
import { getAdminMedia } from "@/server/data/admin-cms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function AdminMediaPage() {
  await requirePermission("media.write");
  const assets = await getAdminMedia();

  return (
    <div>
      <AdminPageHeader title="Media library" description="Upload and manage R2-hosted media." />
      <MediaLibrary
        initial={assets.map((a) => ({ id: a.id, url: a.url, type: a.type, mimeType: a.mimeType }))}
      />
    </div>
  );
}
