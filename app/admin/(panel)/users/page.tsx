import { UserPlus } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminUsers, getRoleOptions } from "@/server/data/admin-cms";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewUserForm, ToggleUserButton, EditUserButton } from "@/components/admin/user-admin";
import { AdminCard, Avatar, CountPill, Reveal, Th, Toolbar } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requirePermission("users.manage");
  const [users, roles] = await Promise.all([getAdminUsers(), getRoleOptions()]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governance"
        title="Admin users"
        description="Staff accounts and their roles."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <Toolbar>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Team</h2>
              <CountPill>{users.length}</CountPill>
            </div>
          </Toolbar>

          <Reveal delay={0.05}>
            <AdminCard className="overflow-hidden">
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <Th>User</Th>
                      <Th>Role</Th>
                      <Th>Last login</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {users.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-primary-50/40">
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-3">
                            <Avatar name={u.name} className="size-9" />
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="truncate font-semibold text-foreground">
                                  {u.name}
                                </span>
                                {!u.isActive ? <Badge variant="outline">Inactive</Badge> : null}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {u.email}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary">
                            {u.role?.name ?? "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                          {u.lastLoginAt ? formatDate(u.lastLoginAt, "en") : "Never"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <EditUserButton
                              user={{ id: u.id, name: u.name, email: u.email, roleId: u.roleId }}
                              roles={roles}
                            />
                            <ToggleUserButton id={u.id} isActive={u.isActive} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-border/70 md:hidden">
                {users.map((u) => (
                  <li key={u.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={u.name} className="size-10" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold text-foreground">{u.name}</span>
                          {!u.isActive ? <Badge variant="outline">Inactive</Badge> : null}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {u.email}
                        </span>
                        <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 font-semibold text-primary">
                            {u.role?.name ?? "—"}
                          </span>
                          {u.lastLoginAt ? formatDate(u.lastLoginAt, "en") : "Never"}
                        </span>
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <EditUserButton
                          user={{ id: u.id, name: u.name, email: u.email, roleId: u.roleId }}
                          roles={roles}
                        />
                        <ToggleUserButton id={u.id} isActive={u.isActive} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </AdminCard>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <AdminCard className="h-fit p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-foreground">
              <span className="grid size-9 place-items-center rounded-xl bg-primary-50 text-primary">
                <UserPlus className="size-[18px]" />
              </span>
              New admin user
            </h2>
            <NewUserForm roles={roles} />
          </AdminCard>
        </Reveal>
      </div>
    </div>
  );
}
