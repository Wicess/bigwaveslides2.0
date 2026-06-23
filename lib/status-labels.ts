/** Human labels for the various status enums shown in the customer account. */

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const LABELS: Record<string, { en: string; fr: string; tone: Tone }> = {
  // Order / payment
  PENDING: { en: "Pending", fr: "En attente", tone: "warning" },
  PROCESSING: { en: "Processing", fr: "En traitement", tone: "info" },
  FULFILLED: { en: "Fulfilled", fr: "Honorée", tone: "success" },
  INVOICE_SENT: { en: "Invoice sent", fr: "Facture envoyée", tone: "info" },
  DEPOSIT_PAID: { en: "Deposit paid", fr: "Acompte payé", tone: "info" },
  PAID_IN_FULL: { en: "Paid in full", fr: "Payé intégralement", tone: "success" },
  // Booking
  REQUESTED: { en: "Requested", fr: "Demandée", tone: "warning" },
  CONFIRMED: { en: "Confirmed", fr: "Confirmée", tone: "success" },
  COMPLETED: { en: "Completed", fr: "Terminée", tone: "success" },
  DECLINED: { en: "Declined", fr: "Refusée", tone: "danger" },
  // Quote
  NEW: { en: "New", fr: "Nouvelle", tone: "warning" },
  REVIEWED: { en: "Reviewed", fr: "Examinée", tone: "info" },
  QUOTED: { en: "Quoted", fr: "Devis envoyé", tone: "info" },
  WON: { en: "Won", fr: "Gagnée", tone: "success" },
  LOST: { en: "Lost", fr: "Perdue", tone: "neutral" },
  // Contract
  DRAFT: { en: "Draft", fr: "Brouillon", tone: "warning" },
  SENT: { en: "Sent", fr: "Envoyé", tone: "info" },
  SIGNED: { en: "Signed", fr: "Signé", tone: "success" },
  VOID: { en: "Void", fr: "Annulé", tone: "danger" },
  // Shared
  CANCELLED: { en: "Cancelled", fr: "Annulée", tone: "danger" },
};

export function statusLabel(token: string, locale: string): string {
  const entry = LABELS[token];
  if (!entry) return token;
  return locale === "fr" ? entry.fr : entry.en;
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
