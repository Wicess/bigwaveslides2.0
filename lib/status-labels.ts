/** Human labels for the various status enums shown in the customer account. */

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const LABELS: Record<string, { label: string; tone: Tone }> = {
  // Order / payment
  PENDING: { label: "Pending", tone: "warning" },
  PROCESSING: { label: "Processing", tone: "info" },
  FULFILLED: { label: "Fulfilled", tone: "success" },
  INVOICE_SENT: { label: "Invoice sent", tone: "info" },
  DEPOSIT_PAID: { label: "Deposit paid", tone: "info" },
  PAID_IN_FULL: { label: "Paid in full", tone: "success" },
  // Booking
  REQUESTED: { label: "Requested", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  DECLINED: { label: "Declined", tone: "danger" },
  // Quote
  NEW: { label: "New", tone: "warning" },
  REVIEWED: { label: "Reviewed", tone: "info" },
  QUOTED: { label: "Quoted", tone: "info" },
  WON: { label: "Won", tone: "success" },
  LOST: { label: "Lost", tone: "neutral" },
  // Contract
  DRAFT: { label: "Draft", tone: "warning" },
  SENT: { label: "Sent", tone: "info" },
  SIGNED: { label: "Signed", tone: "success" },
  VOID: { label: "Void", tone: "danger" },
  // Shared
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

export function statusLabel(token: string): string {
  return LABELS[token]?.label ?? token;
}

export function statusTone(token: string): Tone {
  return LABELS[token]?.tone ?? "neutral";
}

export const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-secondary/15 text-secondary-600",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};
