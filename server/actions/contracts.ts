"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  contractNumber: z.string().min(1),
  signerName: z.string().min(2).max(120),
  agree: z.literal(true),
});

export type SignResult = { ok: boolean; error?: string };

/**
 * Capture a legally-meaningful e-signature on a rental contract: signer name,
 * timestamp, IP, and an immutable audit-trail entry. PDF rendering + storage to
 * R2 is layered in Phase 17; the signed record itself is authoritative here.
 */
export async function signContract(
  input: z.input<typeof schema>,
): Promise<SignResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please type your full name and accept the terms." };
  }
  const { contractNumber, signerName } = parsed.data;

  try {
    const contract = await prisma.rentalContract.findUnique({
      where: { contractNumber },
      select: { id: true, status: true },
    });
    if (!contract) return { ok: false, error: "Contract not found." };
    if (contract.status === "SIGNED") return { ok: true };
    if (contract.status === "VOID") {
      return { ok: false, error: "This contract is no longer valid." };
    }

    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      hdrs.get("x-real-ip") ??
      null;
    const userAgent = hdrs.get("user-agent") ?? null;
    const signedAt = new Date();

    await prisma.rentalContract.update({
      where: { id: contract.id },
      data: {
        status: "SIGNED",
        signerName,
        signedAt,
        ipAddress: ip,
        auditTrail: {
          event: "signed",
          signerName,
          at: signedAt.toISOString(),
          ip,
          userAgent,
        },
      },
    });

    revalidatePath(`/contract/${contractNumber}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
