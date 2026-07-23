"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AdminSelect — a site-styled single-choice dropdown for the admin panel.
 *
 * Replaces the native <select>, whose option list is drawn by the OS (a dark
 * full-width dialog on Android) and can't be themed. Rendered in a portal with
 * fixed positioning so it's never clipped by a card/table `overflow`; matches
 * the width of its trigger; closes on outside click, Escape, or scroll; flips
 * above when there's little room below.
 */
export type AdminSelectOption = { value: string; label: string };

type Coords = { top?: number; bottom?: number; left: number; width: number };

export function AdminSelect({
  value,
  onChange,
  options,
  className,
  ariaLabel,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
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
    const below = window.innerHeight - r.bottom;
    const openUp = below < 280 && r.top > below;
    setCoords({
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      left: r.left,
      width: r.width,
    });
  }, []);

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

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "border-border text-foreground flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 text-sm font-medium transition-colors",
          "hover:border-primary/40 focus-visible:border-primary focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none",
          open && "border-primary/50 ring-ring/30 ring-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && mounted && coords
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              className="admin-pop border-border fixed z-[60] max-h-72 overflow-auto rounded-2xl border bg-white p-1.5 shadow-[var(--shadow-soft)]"
              style={{
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                width: coords.width,
              }}
            >
              {options.map((o) => {
                const isSel = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      isSel
                        ? "bg-primary-50 text-primary"
                        : "text-foreground/80 hover:bg-primary-50 hover:text-primary",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSel ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
