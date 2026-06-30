import { Shield, Users, KeyRound } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getRoles } from "@/server/data/admin-cms";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, IconChip, Reveal } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requirePermission("roles.manage");
  const roles = await getRoles();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governance"
        title="Roles & permissions"
        description="Role definitions and their permission counts."
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((r, i) => (
          <Reveal key={r.id} delay={Math.min(i * 0.05, 0.3)}>
            <AdminCard hover className="h-full p-6">
              <div className="flex items-start justify-between">
                <IconChip icon={Shield} className="size-11" />
                <Badge variant="secondary">{r.type}</Badge>
              </div>
              <h2 className="mt-4 font-display text-lg font-bold text-foreground">{r.name}</h2>
              {r.description ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                  <KeyRound className="size-3.5 text-primary" /> {r._count.permissions} permissions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                  <Users className="size-3.5 text-primary" /> {r._count.users} users
                </span>
              </div>
            </AdminCard>
          </Reveal>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        Role/permission editing is managed via the database seed and migrations.
      </p>
    </div>
  );
}
