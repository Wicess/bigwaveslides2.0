import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatInbox } from "@/components/admin/chat/chat-inbox";
import { requirePermission } from "@/lib/admin-auth";
import { CHAT_PERMISSION } from "@/lib/chat/admin";

export const metadata: Metadata = { title: "Messages" };

/**
 * The operator's inbox: live chat, contact-form and bulk enquiries, in one place.
 *
 * It fills the admin frame's content area under the top bar, and only its panes
 * scroll, so the reply box is always on screen. There is no visible title: the
 * inbox's own list header names it, and a heading above it would push the reply box
 * down. On a phone the list and the open conversation take turns.
 *
 * Sign-in is enforced by the admin layout and the chat permission here, and again by
 * every API route the inbox calls (lib/chat/admin-guard.ts).
 */
export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string | string[] }>;
}) {
  await requirePermission(CHAT_PERMISSION);
  return (
    <div className="h-full">
      {/* The inbox's own list header names the page; the heading is for screen readers. */}
      <h1 className="sr-only">Messages</h1>
      <Suspense fallback={<ChatInbox />}>
        <InboxOpenedOn searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/**
 * `?thread=<id>` opens that conversation. It is what a chat, contact or bulk-quote
 * notification links to, so tapping one on a phone lands on the conversation to
 * answer, not on the inbox list with the job of finding it.
 */
async function InboxOpenedOn({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string | string[] }>;
}) {
  const { thread } = await searchParams;
  const id =
    typeof thread === "string" && /^[a-z0-9]{10,40}$/i.test(thread)
      ? thread
      : null;
  return <ChatInbox initialThreadId={id} />;
}
