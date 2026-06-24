import { requirePermission } from "@/lib/admin-auth";
import { getAdminUsers, getRoleOptions } from "@/server/data/admin-cms";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewUserForm, ToggleUserButton, EditUserButton } from "@/components/admin/user-admin";

export default async function AdminUsersPage() {
  await requirePermission("users.manage");
  const [users, roles] = await Promise.all([getAdminUsers(), getRoleOptions()]);

  return (
    <div>
      <AdminPageHeader title="Admin users" description="Staff accounts and their roles." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Last login</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-medium">{u.name}</span>
                      {!u.isActive ? <Badge variant="outline" className="ml-2">Inactive</Badge> : null}
                      <span className="block text-xs text-muted-foreground">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.role?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt, "en") : "Never"}
                    </td>
                    <td className="px-4 py-3">
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
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">New admin user</h2>
          <NewUserForm roles={roles} />
        </Card>
      </div>
    </div>
  );
}
