import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findThread, visitorId } from "@/lib/chat/core";

/**
 * An email this visitor has already given the site, so the chat does not ask again
 * (owner, 2026-11-01): from the newsletter pop-up or footer form, or from the chat
 * itself. Kept in an httpOnly cookie on this browser only. It is an address the
 * visitor typed themselves, so it unlocks nothing; it only fills the chat's email.
 */
export const KNOWN_EMAIL_COOKIE = "sr_known_email";
const email = z.string().trim().toLowerCase().email().max(320);

export async function getKnownEmail(): Promise<string | null> {
  const parsed = email.safeParse(
    (await cookies()).get(KNOWN_EMAIL_COOKIE)?.value ?? "",
  );
  return parsed.success ? parsed.data : null;
}

/** Remember the address, and put it on this visitor's conversation if it has none yet. */
export async function rememberKnownEmail(raw: string): Promise<void> {
  const parsed = email.safeParse(raw);
  if (!parsed.success) return;
  (await cookies()).set(KNOWN_EMAIL_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  const thread = await findThread(await visitorId(false));
  if (thread && !thread.email) {
    await prisma.supportThread.update({
      where: { id: thread.id },
      data: { email: parsed.data },
    });
  }
}
