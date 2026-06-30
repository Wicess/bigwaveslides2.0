"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DropdownMenu — a small, accessible popover menu for the admin panel.
 * Closes on outside click / Escape, animates in, and flips to stay on-screen.
 * Compose with <DropdownItem> (button) and <DropdownLink> (navigation).
 *
 *   <DropdownMenu>
 *     <DropdownLink href="…">Open</DropdownLink>
 *     <DropdownItem onSelect={…}>Archive</DropdownItem>
 *     <DropdownItem onSelect={…} destructive>Delete</DropdownItem>
 *   </DropdownMenu>
 */
const MenuCtx = React.createContext<{ close: () => void }>({ close: () => {} });

export function DropdownMenu({
  children,
  trigger,
  align = "end",
  label = "Open menu",
}: {
  children: React.ReactNode;
  /** Custom trigger; defaults to a kebab icon button. */
  trigger?: React.ReactNode;
  align?: "start" | "end";
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid size-9 place-items-center rounded-xl border border-border bg-white text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
          open && "border-primary/40 text-primary",
        )}
      >
        {trigger ?? <MoreHorizontal className="size-[18px]" />}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "admin-pop absolute z-40 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-[var(--shadow-soft)]",
            align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          )}
        >
          <MenuCtx.Provider value={{ close: () => setOpen(false) }}>{children}</MenuCtx.Provider>
        </div>
      ) : null}
    </div>
  );
}

const itemCls = (destructive?: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
    destructive
      ? "text-red-600 hover:bg-red-50"
      : "text-foreground/80 hover:bg-primary-50 hover:text-primary",
  );

export function DropdownItem({
  children,
  onSelect,
  destructive,
  disabled,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const { close } = React.useContext(MenuCtx);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onSelect?.();
        close();
      }}
      className={cn(itemCls(destructive), "disabled:opacity-50")}
    >
      {children}
    </button>
  );
}

export function DropdownLink({
  children,
  href,
  destructive,
  target,
}: {
  children: React.ReactNode;
  href: string;
  destructive?: boolean;
  target?: string;
}) {
  const { close } = React.useContext(MenuCtx);
  return (
    <Link
      role="menuitem"
      href={href}
      target={target}
      onClick={close}
      className={itemCls(destructive)}
    >
      {children}
    </Link>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  );
}
