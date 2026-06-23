"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  CalendarCheck,
  ShoppingCart,
  FileText,
  LogOut,
  Waves,
} from "lucide-react";
import { adminLogout } from "@/server/actions/admin-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
] as const;

export function AdminSidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4 text-primary">
        <Waves className="size-6" />
        <span className="font-bold">Big Wave</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active(item.href, "exact" in item ? item.exact : false)
                  ? "bg-primary-50 text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="px-2 pb-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{role}</p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void adminLogout().then(() => location.assign("/admin/login")))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 disabled:opacity-50"
        >
          <LogOut className="size-4.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
