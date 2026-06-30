"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import {
  createAdminSession,
  destroyAdminSession,
  logActivity,
} from "@/lib/admin-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AdminLoginResult = { ok: boolean; error?: string };

export async function adminLogin(
  input: z.input<typeof schema>,
): Promise<AdminLoginResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter your email and password." };
  }

  // Throttle brute-force attempts: 8 tries per IP per 15 minutes.
  const limit = rateLimit(
    clientKeyFromHeaders(await headers(), "admin-login"),
    8,
    15 * 60 * 1000,
  );
  if (!limit.ok) {
    return {
      ok: false,
      error:
        "Too many sign-in attempts. Please wait a few minutes and try again.",
    };
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      include: {
        role: { include: { permissions: { select: { key: true } } } },
      },
    });
    if (!admin || !admin.isActive) {
      return { ok: false, error: "Invalid credentials." };
    }
    const valid = await bcrypt.compare(
      parsed.data.password,
      admin.passwordHash,
    );
    if (!valid) return { ok: false, error: "Invalid credentials." };

    const superAdmin = admin.role?.type === "SUPER_ADMIN";
    await createAdminSession({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role?.name ?? "—",
      perms: admin.role?.permissions.map((p) => p.key) ?? [],
      superAdmin,
    });

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    await logActivity(admin.id, "admin.login", { summary: "Signed in" });

    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function adminLogout(): Promise<void> {
  await destroyAdminSession();
}
