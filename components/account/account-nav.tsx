"use client";

import { useTransition } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarCheck,
  FileText,
  FileSignature,
  Heart,
  UserCog,
  LogOut,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { signOutAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", key: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", key: "orders", icon: ShoppingBag },
  { href: "/account/bookings", key: "bookings", icon: CalendarCheck },
  { href: "/account/quotes", key: "quotes", icon: FileText },
  { href: "/account/contracts", key: "contracts", icon: FileSignature },
  { href: "/account/wishlist", key: "wishlist", icon: Heart },
  { href: "/account/profile", key: "profile", icon: UserCog },
] as const;

export function AccountNav() {
  const t = useTranslations("Account");
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const isActive = (item: (typeof ITEMS)[number]) =>
    "exact" in item && item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-50 text-primary"
                : "text-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4.5" />
            {t(`nav_${item.key}`)}
          </Link>
        );
      })}
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void signOutAction())}
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 disabled:opacity-50"
      >
        <LogOut className="size-4.5" />
        {t("signOut")}
      </button>
    </nav>
  );
}
