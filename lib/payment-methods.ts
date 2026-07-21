import "server-only";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { formatPrice } from "@/lib/format";

// -----------------------------------------------------------------------------
// Manual payment rails (Zelle, Cash App, …). There is no card processor — the
// owner either pre-configures a rail's destination here (via the admin editor)
// or posts details per-order by hand. `resolvePaymentDetails` is what makes the
// client-facing step feel instant: if the rail is enabled and has a
// destination, details are issued the moment the client picks it.
// -----------------------------------------------------------------------------

export type PaymentMethod = {
  method: string;
  label: string;
  destination: string;
  instructions: string;
  network: string | null;
  qrImageUrl: string | null;
  enabled: boolean;
  sortOrder: number;
};

/** Canonical rails, so the admin editor renders before any DB row exists. */
export const DEFAULT_METHODS: PaymentMethod[] = [
  {
    method: "zelle",
    label: "Zelle",
    destination: "",
    instructions:
      "Send {{amount}} via Zelle to {{destination}}. Put your invoice number {{orderNumber}} in the memo so we can match your payment instantly.",
    network: null,
    qrImageUrl: null,
    enabled: false,
    sortOrder: 0,
  },
  {
    method: "cash-app",
    label: "Cash App",
    destination: "",
    instructions:
      "Send {{amount}} on Cash App to {{destination}}. Add your invoice number {{orderNumber}} in the note.",
    network: null,
    qrImageUrl: null,
    enabled: false,
    sortOrder: 1,
  },
  {
    method: "apple-pay",
    label: "Apple Pay",
    destination: "",
    instructions:
      "Send {{amount}} with Apple Pay (Apple Cash) to {{destination}}. Mention invoice {{orderNumber}} in the message.",
    network: null,
    qrImageUrl: null,
    enabled: false,
    sortOrder: 2,
  },
  {
    method: "chime",
    label: "Chime",
    destination: "",
    instructions:
      "Send {{amount}} via Chime to {{destination}}. Include invoice {{orderNumber}} in the note.",
    network: null,
    qrImageUrl: null,
    enabled: false,
    sortOrder: 3,
  },
  {
    method: "crypto",
    label: "Crypto",
    destination: "",
    instructions:
      "Send the equivalent of {{amount}} to wallet {{destination}} on {{network}}. Double-check the network before sending — transfers on the wrong network can't be recovered. Reference: {{orderNumber}}.",
    network: "USDT · TRON (TRC-20)",
    qrImageUrl: null,
    enabled: false,
    sortOrder: 4,
  },
];

/** DB rows merged over the defaults, sorted for display. */
export async function loadPaymentMethods(): Promise<PaymentMethod[]> {
  const rows = await withRetry(() =>
    prisma.paymentMethodConfig.findMany({ orderBy: { sortOrder: "asc" } }),
  ).catch(() => []);
  const byMethod = new Map(rows.map((r) => [r.method, r]));
  const merged: PaymentMethod[] = DEFAULT_METHODS.map((d) => {
    const row = byMethod.get(d.method);
    byMethod.delete(d.method);
    return row
      ? {
          method: row.method,
          label: row.label,
          destination: row.destination,
          instructions: row.instructions || d.instructions,
          network: row.network,
          qrImageUrl: row.qrImageUrl,
          enabled: row.enabled,
          sortOrder: row.sortOrder,
        }
      : d;
  });
  // Custom rails the owner added beyond the defaults.
  for (const row of byMethod.values()) {
    merged.push({
      method: row.method,
      label: row.label,
      destination: row.destination,
      instructions: row.instructions,
      network: row.network,
      qrImageUrl: row.qrImageUrl,
      enabled: row.enabled,
      sortOrder: row.sortOrder,
    });
  }
  return merged.sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Rails the client is allowed to pick from (enabled — even if the owner
    still has to post the destination by hand afterwards). */
export async function loadEnabledMethods(): Promise<PaymentMethod[]> {
  return (await loadPaymentMethods()).filter((m) => m.enabled);
}

export async function savePaymentMethods(
  list: Array<
    Pick<PaymentMethod, "method" | "label"> & Partial<PaymentMethod>
  >,
): Promise<void> {
  for (const [i, m] of list.entries()) {
    await prisma.paymentMethodConfig.upsert({
      where: { method: m.method },
      update: {
        label: m.label,
        destination: m.destination ?? "",
        instructions: m.instructions ?? "",
        network: m.network ?? null,
        qrImageUrl: m.qrImageUrl ?? null,
        enabled: m.enabled ?? false,
        sortOrder: m.sortOrder ?? i,
      },
      create: {
        method: m.method,
        label: m.label,
        destination: m.destination ?? "",
        instructions: m.instructions ?? "",
        network: m.network ?? null,
        qrImageUrl: m.qrImageUrl ?? null,
        enabled: m.enabled ?? false,
        sortOrder: m.sortOrder ?? i,
      },
    });
  }
}

export type ResolvedPaymentDetails = {
  methodKey: string;
  methodLabel: string;
  destination: string;
  instructions: string;
  network: string | null;
  qrImageUrl: string | null;
};

function fillTemplate(
  template: string,
  ctx: {
    amountCents: number;
    orderNumber: string;
    destination: string;
    network?: string | null;
    locale?: string;
  },
): string {
  return template
    .replaceAll("{{amount}}", formatPrice(ctx.amountCents, ctx.locale ?? "en"))
    .replaceAll("{{orderNumber}}", ctx.orderNumber)
    .replaceAll("{{destination}}", ctx.destination)
    .replaceAll("{{network}}", ctx.network ?? "");
}

/** Filled payment details for a rail — ONLY if it's enabled and has a
    destination; otherwise null → the order takes the "awaiting details" path
    and the owner posts details from admin. */
export async function resolvePaymentDetails(
  method: string,
  ctx: { amountCents: number; orderNumber: string; locale?: string },
): Promise<ResolvedPaymentDetails | null> {
  const rail = (await loadPaymentMethods()).find((m) => m.method === method);
  if (!rail || !rail.enabled || !rail.destination.trim()) return null;
  return {
    methodKey: rail.method,
    methodLabel: rail.label,
    destination: rail.destination,
    instructions: fillTemplate(rail.instructions, {
      ...ctx,
      destination: rail.destination,
      network: rail.network,
    }),
    network: rail.network,
    qrImageUrl: rail.qrImageUrl,
  };
}

/** Fill a rail's template when the owner posts a destination by hand for an
    order (rail may never have been configured). */
export async function buildInstructionsForMethod(
  method: string,
  ctx: {
    amountCents: number;
    orderNumber: string;
    destination: string;
    locale?: string;
  },
): Promise<{ label: string; instructions: string; network: string | null }> {
  const rail =
    (await loadPaymentMethods()).find((m) => m.method === method) ??
    DEFAULT_METHODS.find((m) => m.method === method);
  const label = rail?.label ?? method;
  const template =
    rail?.instructions ||
    "Send {{amount}} via " +
      label +
      " to {{destination}}. Reference your invoice number {{orderNumber}}.";
  return {
    label,
    instructions: fillTemplate(template, {
      ...ctx,
      network: rail?.network ?? null,
    }),
    network: rail?.network ?? null,
  };
}
