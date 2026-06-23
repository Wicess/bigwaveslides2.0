import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex">
      <div className="sticky top-0 hidden lg:block">
        <AdminSidebar name={session.name} role={session.role} />
      </div>
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
