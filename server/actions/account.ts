"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().or(z.literal("")),
  organizationName: z.string().max(160).optional().or(z.literal("")),
  marketingOptIn: z.boolean().optional(),
});

export type ProfileResult = { ok: boolean; error?: string };

export async function updateProfile(
  input: z.input<typeof profileSchema>,
): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const { name, phone, organizationName, marketingOptIn } = parsed.data;

  try {
    await prisma.customer.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
        organizationName: organizationName || null,
        marketingOptIn: marketingOptIn ?? false,
      },
    });
    revalidatePath("/account/profile");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update your profile." };
  }
}
