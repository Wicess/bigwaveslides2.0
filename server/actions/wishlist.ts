"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type WishlistResult = { ok: boolean; error?: string };

/** Remove a saved product from the signed-in customer's wishlist. */
export async function removeFromWishlist(productId: string): Promise<WishlistResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };

  try {
    await prisma.wishlistItem.deleteMany({
      where: { customerId: session.user.id, productId },
    });
    revalidatePath("/account/wishlist");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update your wishlist." };
  }
}

/**
 * Merge a guest's localStorage wishlist (product slugs) into the customer's
 * saved items on first sign-in. Idempotent via the unique (customer, product).
 */
export async function syncWishlist(slugs: string[]): Promise<WishlistResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };
  if (!Array.isArray(slugs) || slugs.length === 0) return { ok: true };

  try {
    const products = await prisma.product.findMany({
      where: { slug: { in: slugs.slice(0, 100) } },
      select: { id: true },
    });
    if (products.length === 0) return { ok: true };

    await prisma.wishlistItem.createMany({
      data: products.map((p) => ({ customerId: session.user.id, productId: p.id })),
      skipDuplicates: true,
    });
    revalidatePath("/account/wishlist");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't sync your wishlist." };
  }
}
