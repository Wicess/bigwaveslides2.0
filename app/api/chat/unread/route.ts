import { NextResponse } from "next/server";
import { findThread, visitorId } from "@/lib/chat/core";
import { threadTopic } from "@/lib/chat/live-topic";

/**
 * How many staff messages this visitor has not read. One small read for the badges
 * on the chat and profile icons. The watcher calls it only for a visitor who has a
 * conversation: when their live topic is pinged, on return to the tab, and as a rare
 * safety check (every 30s only while the live stream is unavailable), so it cannot
 * hold the database awake for a site left open on a second monitor.
 */
export async function GET(): Promise<Response> {
  const visitor = await visitorId(false);
  const thread = await findThread(visitor);
  return NextResponse.json(
    {
      unread: thread?.unreadForCustomer ?? 0,
      hasThread: Boolean(thread),
      // The conversation's live topic (lib/chat/live-topic.ts): the browser listens
      // there and asks again only when it is pinged.
      ...(thread ? { topic: threadTopic(thread.id) } : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
