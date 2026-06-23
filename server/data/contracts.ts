import "server-only";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

/** Load a contract with its booking + line items for the signing page. */
export async function getContractByNumber(contractNumber: string) {
  return withRetry(() =>
    prisma.rentalContract.findUnique({
      where: { contractNumber },
      include: {
        booking: {
          include: {
            items: true,
          },
        },
      },
    }),
  ).catch(() => null);
}

export type ContractWithBooking = NonNullable<
  Awaited<ReturnType<typeof getContractByNumber>>
>;
