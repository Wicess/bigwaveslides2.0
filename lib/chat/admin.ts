import "server-only";
import { can, getAdminSession, logActivity } from "@/lib/admin-auth";

/**
 * The chat's view of a signed-in admin, built on Splash Republic's own session.
 * Chat access uses the existing "contact.manage" permission (the contact inbox),
 * so whoever answers contact messages answers chats; a super admin has it anyway.
 */
export interface AdminIdentity {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
}

export const CHAT_PERMISSION = "contact.manage";

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const session = await getAdminSession();
  if (!session) return null;
  return {
    userId: session.id,
    email: session.email,
    name: session.name || session.email,
    role: session.role,
  };
}

export async function canUseChat(): Promise<AdminIdentity | null> {
  const session = await getAdminSession();
  if (!session || !can(session, CHAT_PERMISSION)) return null;
  return {
    userId: session.id,
    email: session.email,
    name: session.name || session.email,
    role: session.role,
  };
}

/** The chat's audit entries, written to Splash Republic's activity log. */
export async function recordAdminAction(entry: {
  readonly entityType: string;
  readonly entityId: string;
  readonly action: string;
  readonly actor: Pick<AdminIdentity, "userId" | "email">;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly reason?: string;
}): Promise<void> {
  await logActivity(entry.actor.userId, `chat.${entry.action.toLowerCase()}`, {
    entityType: entry.entityType,
    entityId: entry.entityId,
    summary: entry.reason,
    diff: { before: entry.before ?? null, after: entry.after ?? null },
  });
}
