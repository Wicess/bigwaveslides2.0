"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCartCookie, setCartCookie } from "@/lib/cart-session";

export type CartActionResult = { ok: boolean; count?: number; error?: string };

const MAX_QTY = 99;

/** Find the active cart for this session, or create one and set the cookie. */
async function ensureCart(): Promise<string> {
  const existing = await getCartCookie();
  if (existing) {
    const cart = await prisma.cart.findFirst({
      where: { id: existing, status: "ACTIVE" },
      select: { id: true },
    });
    if (cart) return cart.id;
  }
  const cart = await prisma.cart.create({
    data: { status: "ACTIVE" },
    select: { id: true },
  });
  await setCartCookie(cart.id);
  return cart.id;
}

async function countFor(cartId: string): Promise<number> {
  const agg = await prisma.cartItem.aggregate({
    where: { cartId },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

async function touch(cartId: string) {
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      lastActivityAt: new Date(),
      status: "ACTIVE",
      reminderSentAt: null,
    },
  });
}

export async function addToCart(
  productId: string,
  quantity = 1,
  mode: "BUY" | "RENT" = "BUY",
): Promise<CartActionResult> {
  if (!productId) return { ok: false, error: "Missing product" };
  const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(quantity)));
  const cartMode = mode === "RENT" ? "RENT" : "BUY";

  try {
    // Guard against adding an unknown/inactive product.
    const product = await prisma.product.findFirst({
      where: { id: productId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!product) return { ok: false, error: "Product unavailable" };

    const cartId = await ensureCart();

    // One cart, one mode. Renting and buying are different transactions with
    // different totals, different copy and — critically — different checkouts:
    // a rental needs an event date and availability, a purchase needs a
    // quantity and a delivery address. A cart holding both cannot present a
    // coherent summary or a single "Book Now"/"Order Now" button, so we refuse
    // the mix at the door rather than trying to reconcile it at checkout.
    const opposite = await prisma.cartItem.findFirst({
      where: { cartId, mode: cartMode === "RENT" ? "BUY" : "RENT" },
      select: { id: true },
    });
    if (opposite) {
      return {
        ok: false,
        error:
          cartMode === "RENT"
            ? "Your cart has items to buy — check out or clear it before adding a rental."
            : "Your cart has rentals — check out or clear it before adding a purchase.",
      };
    }

    // Buy and rent of the same product are kept as separate lines.
    const existing = await prisma.cartItem.findFirst({
      where: { cartId, productId, variationId: null, mode: cartMode },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(MAX_QTY, existing.quantity + qty) },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId, productId, quantity: qty, mode: cartMode },
      });
    }
    await touch(cartId);
    revalidatePath("/cart");
    return { ok: true, count: await countFor(cartId) };
  } catch {
    return { ok: false, error: "Couldn't add to cart. Please try again." };
  }
}

/** Verify an item belongs to the caller's active cart before mutating it. */
async function ownedItem(itemId: string) {
  const cartId = await getCartCookie();
  if (!cartId) return null;
  return prisma.cartItem.findFirst({
    where: { id: itemId, cartId, cart: { status: "ACTIVE" } },
    select: { id: true, cartId: true },
  });
}

export async function setQuantity(
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  try {
    const item = await ownedItem(itemId);
    if (!item) return { ok: false, error: "Item not found" };

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: Math.min(MAX_QTY, Math.floor(quantity)) },
      });
    }
    await touch(item.cartId);
    revalidatePath("/cart");
    return { ok: true, count: await countFor(item.cartId) };
  } catch {
    return { ok: false, error: "Couldn't update the cart." };
  }
}

export async function removeItem(itemId: string): Promise<CartActionResult> {
  try {
    const item = await ownedItem(itemId);
    if (!item) return { ok: false, error: "Item not found" };
    await prisma.cartItem.delete({ where: { id: itemId } });
    await touch(item.cartId);
    revalidatePath("/cart");
    return { ok: true, count: await countFor(item.cartId) };
  } catch {
    return { ok: false, error: "Couldn't remove the item." };
  }
}

export async function clearCart(): Promise<CartActionResult> {
  try {
    const cartId = await getCartCookie();
    if (cartId) {
      await prisma.cartItem.deleteMany({ where: { cartId } });
      await prisma.cart.update({
        where: { id: cartId },
        data: { lastActivityAt: new Date() },
      });
    }
    revalidatePath("/cart");
    return { ok: true, count: 0 };
  } catch {
    return { ok: false, error: "Couldn't clear the cart." };
  }
}
