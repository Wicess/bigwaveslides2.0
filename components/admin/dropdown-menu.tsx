"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DropdownMenu — an accessible popover menu for the admin panel.
 * The menu is rendered in a portal with fixed positioning, so it is never
 * clipped by a parent's `overflow` (tables, cards). Closes on outside click,
 * Escape, or scroll; flips above the trigger when there's little room below.
 */
const MenuCtx = React.createContext<{ close: () => void }>({ close: () => {} });

type Coords = { top?: number; bottom?: number; left: number };

export function DropdownMenu({
  children,
  trigger,
  align = "end",
  label = "Open menu",
}: {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  align?: "start" | "end";
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const place = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const openUp = window.innerHeight - r.bottom < 240;
    setCoords({
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      left: align === "end" ? r.right : r.left,
    });
  }, [align]);

  const toggle = () => {
    if (!open) place();
    setOpen((v) => !v);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={toggle}
        className={cn(
          "border-border text-muted-foreground hover:border-primary/40 hover:text-primary grid size-9 place-items-center rounded-xl border bg-white transition-colors",
          open && "border-primary/40 text-primary",
        )}
      >
        {trigger ?? <MoreHorizontal className="size-[18px]" />}
      </button>

      {open && mounted && coords
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="admin-pop border-border fixed z-[60] min-w-[12rem] overflow-hidden rounded-2xl border bg-white p-1.5 shadow-[var(--shadow-soft)]"
              style={{
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                transform: align === "end" ? "translateX(-100%)" : undefined,
              }}
            >
              <MenuCtx.Provider value={{ close: () => setOpen(false) }}>
                {children}
              </MenuCtx.Provider>
            </div>,
            document.body,
          )
        : null}
    </>
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
  return <div className="bg-border my-1 h-px" role="separator" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground/70 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase">
      {children}
    </p>
  );
}

/** A destructive menu item that confirms, runs a server action, then refreshes. */
export function DeleteMenuItem({
  action,
  confirm,
  children,
}: {
  action: () => Promise<{ ok: boolean; error?: string } | void>;
  confirm: string;
  children: React.ReactNode;
}) {
  const { close } = React.useContext(MenuCtx);
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirm)) return;
        start(async () => {
          const res = await action();
          close();
          if (res && res.ok === false) {
            window.alert(res.error ?? "Couldn't delete.");
          } else {
            router.refresh();
          }
        });
      }}
      className={cn(itemCls(true), "disabled:opacity-50")}
    >
      {children}
    </button>
  );
}
