import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/admin-sidebar";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <AdminShell name={session.name} role={session.role}>
      {children}
    </AdminShell>
  );
}
