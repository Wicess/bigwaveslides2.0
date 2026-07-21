"use client";

import { cn } from "@/lib/utils";

/** The admin panel's single switch control — amber gradient when on, with a
    visible focus ring. Use this everywhere instead of hand-rolling toggles so
    the control vocabulary stays consistent across screens. */
export function AdminSwitch({
  checked,
  onChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Accessible name for the switch. */
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "focus-visible:ring-ring relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "[background:var(--gradient-wave)]"
          : "bg-muted-foreground/25",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
