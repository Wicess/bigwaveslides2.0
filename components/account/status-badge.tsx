import { statusLabel, statusTone, TONE_CLASS } from "@/lib/status-labels";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, locale }: { status: string; locale: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASS[statusTone(status)],
      )}
    >
      {statusLabel(status, locale)}
    </span>
  );
}
