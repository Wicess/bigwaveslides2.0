"use client";

import { useEffect, useId, useRef } from "react";

/**
 * WHAM's confirm step for the two irreversible-feeling actions — blocking a visitor
 * and deleting a conversation. Escape and the scrim cancel; focus starts on the
 * SAFE button, so a stray Enter keeps the conversation rather than losing it.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previously = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previously?.focus?.();
    };
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-(--z-modal) grid place-items-center bg-stone-950/50 p-4 motion-safe:animate-[fade-in_150ms_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-surface w-full max-w-sm rounded-2xl border p-5 shadow-2xl motion-safe:animate-[bubble-in_180ms_var(--ease-out-expo)]">
        <p id={titleId} className="text-foreground text-sm font-semibold">
          {title}
        </p>
        <div className="text-foreground-muted mt-1.5 text-[13px] leading-relaxed">
          {body}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="text-foreground-muted hover:bg-surface-sunken hover:text-foreground min-h-10 rounded-lg px-3.5 text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-danger-fg text-background min-h-10 rounded-lg px-4 text-sm font-semibold hover:opacity-90 active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
