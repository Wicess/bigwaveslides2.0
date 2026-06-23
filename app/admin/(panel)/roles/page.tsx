import { requirePermission } from "@/lib/admin-auth";
import { getRoles } from "@/server/data/admin-cms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminRolesPage() {
  await requirePermission("roles.manage");
  const roles = await getRoles();

  return (
    <div>
      <AdminPageHeader
        title="Roles & permissions"
        description="Role definitions and their permission counts."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{r.name}</h2>
              <Badge variant="secondary">{r.type}</Badge>
            </div>
            {r.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
            ) : null}
            <p className="mt-3 text-sm text-muted-foreground">
              {r._count.permissions} permissions · {r._count.users} users
            </p>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Role/permission editing is managed via the database seed and migrations.
      </p>
    </div>
  );
}
