"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
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
  Image,
  Settings,
  Shield,
  History,
  LogOut,
  Menu,
  X,
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
      { href: "/admin/media", label: "Media", icon: Image },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, exact: true },
      { href: "/admin/analytics/visitors", label: "Visitors", icon: Users },
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

/** The scrolling nav body shared by the desktop sidebar and the mobile drawer. */
function NavBody({
  name,
  role,
  onNavigate,
}: {
  name: string;
  role: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-border/70 px-5 py-4">
        <NextImage src="/logo.png" alt="Big Wave Slides" width={120} height={102} className="h-9 w-auto" />
        <span className="text-sm font-bold tracking-tight text-foreground/90">Admin</span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active(item.href, "exact" in item ? item.exact : false);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary text-white shadow-[0_6px_16px_-8px_var(--color-primary)]"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-[18px] shrink-0", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/70 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{role}</p>
          </div>
          <button
            type="button"
            disabled={pending}
            aria-label="Sign out"
            onClick={() => startTransition(() => void adminLogout().then(() => location.assign("/admin/login")))}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-red-600 disabled:opacity-50"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminShell — responsive app-like frame for the admin panel.
 * Desktop (lg+): fixed left sidebar. Mobile: sticky top bar with a hamburger
 * that opens a slide-over drawer. Content scrolls independently.
 */
export function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-dvh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-background lg:block">
        <NavBody name={name} role={role} />
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-neutral-950/50 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[82%] max-w-xs bg-background shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-3.5 z-10 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
          <NavBody name={name} role={role} onNavigate={() => setOpen(false)} />
        </div>
      </div>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md lg:hidden [padding-top:max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-9 place-items-center rounded-lg border border-border text-foreground hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>
          <NextImage src="/logo.png" alt="Big Wave Slides" width={120} height={102} className="h-7 w-auto" />
          <span className="text-sm font-bold tracking-tight">Admin</span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
