"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Download,
  Package,
  Boxes,
  ShoppingCart,
  FileText,
  Users,
  Star,
  MessageSquareQuote,
  Inbox,
  Mail,
  Newspaper,
  Settings,
  CreditCard,
  History,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { adminLogout } from "@/server/actions/admin-auth";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Commerce",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      {
        href: "/admin/settings/payments",
        label: "Payments",
        icon: CreditCard,
      },
      { href: "/admin/analytics/visitors", label: "Visitors", icon: Users },
      { href: "/admin/quotes", label: "Quotes", icon: FileText },
    ],
  },
  {
    label: "CRM & comms",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      {
        href: "/admin/testimonials",
        label: "Testimonials",
        icon: MessageSquareQuote,
      },
      { href: "/admin/contacts", label: "Contacts", icon: Inbox },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    label: "Content",
    items: [{ href: "/admin/blog", label: "Blog", icon: Newspaper }],
  },
  {
    label: "Insights",
    items: [
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        exact: true,
      },
      {
        href: "/admin/analytics/app-installs",
        label: "App installs",
        icon: Download,
      },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/users", label: "Users", icon: Users },
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
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col bg-[var(--admin-sidebar)]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-2">
        <span className="grid size-9 place-items-center rounded-xl bg-[var(--gradient-wave,#e8741b)] shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]">
          <NextImage
            src="/logo.png"
            alt="Big Wave Slides"
            width={120}
            height={102}
            className="h-6 w-auto brightness-0 invert"
          />
        </span>
        <span className="font-display text-foreground text-base font-bold tracking-tight">
          Big Wave
          <span className="bg-primary-50 text-primary ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            Admin
          </span>
        </span>
      </div>

      <nav className="admin-noscrollbar flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-muted-foreground/70 px-3 pb-2 text-[10px] font-bold tracking-[0.14em] uppercase">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active(
                  item.href,
                  "exact" in item ? item.exact : false,
                );
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
                      isActive
                        ? "text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]"
                        : "text-foreground/70 hover:bg-primary-50/70 hover:text-foreground",
                    )}
                  >
                    {/* sliding active dot */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-1/2 -left-1 h-5 w-1 -translate-y-1/2 rounded-full bg-white transition-all duration-300",
                        isActive ? "opacity-90" : "opacity-0",
                      )}
                    />
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-primary",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Promo / quick action — view the live storefront */}
      <div className="px-4 pb-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-lift bg-primary-50 block overflow-hidden rounded-2xl p-4"
        >
          <p className="text-primary-800 text-sm font-bold">View storefront</p>
          <p className="text-primary-700/80 mt-0.5 text-xs leading-relaxed">
            Open the live Big Wave Slides site in a new tab.
          </p>
          <span className="text-primary mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">
            Open site <ArrowUpRight className="size-3.5" />
          </span>
        </Link>
      </div>

      {/* User + sign out */}
      <div className="border-border/70 border-t p-3">
        <div className="bg-muted/60 flex items-center gap-3 rounded-2xl px-3 py-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white [background:var(--gradient-wave)]">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm leading-tight font-semibold">
              {name}
            </p>
            <p className="text-muted-foreground truncate text-xs">{role}</p>
          </div>
          <button
            type="button"
            disabled={pending}
            aria-label="Sign out"
            onClick={() =>
              startTransition(
                () =>
                  void adminLogout().then(() =>
                    location.assign("/admin/login"),
                  ),
              )
            }
            className="text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-white hover:text-red-600 disabled:opacity-50"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Time-of-day greeting, computed after mount to avoid SSR/CSR mismatch. */
function useGreeting() {
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening",
    );
  }, []);
  return greeting;
}

/** Slim, sticky top bar — greeting on the left, search + bell + avatar right. */
function TopBar({
  name,
  onOpenMenu,
}: {
  name: string;
  onOpenMenu: () => void;
}) {
  const greeting = useGreeting();
  const first = name.split(" ")[0] ?? name;

  return (
    <header className="admin-rise sticky top-0 z-30 flex items-center gap-3 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="border-border/70 flex w-full items-center gap-3 rounded-[var(--radius-lg)] border bg-[var(--admin-card)]/80 px-3 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur-md sm:px-4">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="border-border text-foreground hover:bg-muted grid size-9 shrink-0 place-items-center rounded-xl border transition-colors lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[11px] font-medium">
            {greeting},
          </p>
          <p className="text-foreground truncate text-sm font-bold">
            {first} 👋
          </p>
        </div>

        {/* Search (desktop) */}
        <div className="relative hidden items-center md:flex">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
          <input
            type="search"
            aria-label="Search"
            placeholder="Search…"
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/15 h-10 w-48 rounded-full border pr-4 pl-9 text-sm transition-all duration-300 outline-none focus:w-64 focus:bg-white focus:ring-2 lg:w-56"
          />
        </div>

        {/* Notifications */}
        <Link
          href="/admin/activity"
          aria-label="Activity & notifications"
          className="border-border text-foreground/70 hover:border-primary/40 hover:text-primary relative grid size-10 shrink-0 place-items-center rounded-full border bg-white transition-all duration-300"
        >
          <Bell className="size-[18px]" />
          <span className="bg-primary absolute top-2.5 right-2.5 size-2 rounded-full ring-2 ring-white" />
        </Link>

        {/* Avatar */}
        <div
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]"
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

/**
 * AdminShell — NovaPay-inspired "floating panel" frame.
 * Desktop (lg+): a dark cocoa canvas holds a single rounded panel — a white nav
 * rail on the left, a cream content column on the right with a sticky top bar.
 * Mobile: a slide-over drawer + the same top bar.
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
    <div className="h-dvh overflow-hidden bg-[var(--admin-canvas)] lg:p-4">
      <div className="flex h-full overflow-hidden bg-[var(--admin-panel)] lg:rounded-[2rem] lg:shadow-[0_40px_90px_-40px_rgba(0,0,0,0.65)]">
        {/* Desktop nav rail — fixed full-height; only the content column scrolls. */}
        <aside className="border-border/70 hidden h-full w-[268px] shrink-0 border-r lg:block">
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
              "absolute inset-0 bg-[#2c1a10]/60 backdrop-blur-sm transition-opacity duration-300",
              open ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-[82%] max-w-xs bg-[var(--admin-sidebar)] shadow-2xl transition-transform duration-300 ease-out",
              open ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-muted-foreground hover:bg-muted absolute top-5 right-3 z-10 grid size-9 place-items-center rounded-lg"
            >
              <X className="size-5" />
            </button>
            <NavBody
              name={name}
              role={role}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>

        {/* Content column — the only scroll container, fills the full width */}
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <TopBar name={name} onOpenMenu={() => setOpen(true)} />
          {/* overflow-x-hidden: entrance animations (admin-rise/slide) use
              horizontal translateX transforms that would otherwise bleed past
              the viewport edge on mobile and create a horizontal scroll that
              cuts off content. Portaled popovers render to <body>, unaffected. */}
          <main className="admin-scroll w-full flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4 pb-6 sm:px-6 lg:px-8 xl:px-10">
            <div className="mx-auto h-full w-full max-w-[1700px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
