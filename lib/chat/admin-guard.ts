import "server-only";
import { NextResponse } from "next/server";
import {
  canUseChat,
  getAdminIdentity,
  type AdminIdentity,
} from "@/lib/chat/admin";

/**
 * Every admin chat endpoint re-checks the session AND the chat permission.
 *
 * These are public HTTP endpoints serving customers' private conversations. The
 * inbox page living behind the admin layout says nothing about who is calling an API
 * route directly, so each one checks for itself.
 */
export async function requireChatAdmin(): Promise<
  { ok: true; identity: AdminIdentity } | { ok: false; response: NextResponse }
> {
  if (!(await getAdminIdentity())) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not signed in" }, { status: 401 }),
    };
  }
  const identity = await canUseChat();
  if (!identity) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, identity };
}
