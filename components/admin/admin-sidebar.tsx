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
  Users,
  Star,
  MessageSquareQuote,
  Inbox,
  Mail,
  Newspaper,
  CalendarDays,
  Image,
  Settings,
  Shield,
  History,
  LogOut,
  Waves,
} from "lucide-react";
import { adminLogout } from "@/server/actions/admin-auth";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Commerce",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/quotes", label: "Quotes", icon: FileText },
    ],
  },
  {
    label: "CRM & comms",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
      { href: "/admin/contacts", label: "Contacts", icon: Inbox },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/media", label: "Media", icon: Image },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/roles", label: "Roles", icon: Shield },
      { href: "/admin/activity", label: "Activity", icon: History },
    ],
  },
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

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
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
