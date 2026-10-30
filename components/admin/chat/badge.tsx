import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-foreground-muted",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
  accent: "bg-accent-muted text-accent-fg",
};

/** A status pill for the chat inbox. Pass an icon when the tone carries meaning. */
export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Tone per Splash Republic order status, for the customer panel. */
export const ORDER_STATUS_TONE: Record<
  string,
  "warning" | "info" | "success" | "danger" | "neutral"
> = {
  PENDING: "warning",
  PROCESSING: "info",
  FULFILLED: "success",
  CANCELLED: "neutral",
};

export function orderStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase();
}
