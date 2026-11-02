"use client";

import { useEffect } from "react";
import { getChatUiOpen, openChat } from "@/lib/chat/chat-ui";
import {
  CHAT_URL,
  showReplyNotification,
  storedNotificationsOn,
} from "@/lib/chat/reply-notify";
import {
  forgetThread,
  getUnread,
  hasThread,
  setUnread,
} from "@/lib/chat/unread-store";
import {
  getCustomerTopic,
  isLive,
  setCustomerTopic,
  watchCustomer,
} from "@/components/chat/live-channel";

/** The fallback cadence, used only while the live stream is unavailable. */
const EVERY_MS = 30_000;
/** While the stream is up, a rare check in case a ping was ever lost. */
const SAFETY_MS = 15 * 60_000;
const IDLE_AFTER_MS = 3 * 60_000;

/*
  Shared by every mounted watcher (the site's, and the profile's on My bookings), so
  one ping or one return to the tab is one request, not two.
*/
let inFlight: Promise<void> | null = null;
let lastCheckAt = 0;

/** The profile (`/en/account…`), where the chat is a full-screen tab, not a pop-up. */
function onProfile(): boolean {
  return /^\/[a-z]{2}(-[A-Za-z]{2})?\/account(\/|$)/.test(
    window.location.pathname,
  );
}

/**
 * Keeps the unread badges current while the chat is closed, and when a new staff
 * message arrives, opens the chat pop-up onto it (owner, 2026-11-01) and pops a
 * notification if the visitor turned notifications on. On the profile, which has the
 * full-screen chat a tap away, only the badge counts up.
 *
 * Cost first, as the cost playbook asks: nothing at all for a visitor with no
 * conversation. Otherwise the check is PUSH-DRIVEN: the server pings the
 * conversation's ntfy topic whenever the team writes (lib/chat/live-topic.ts), the
 * shared stream (live-channel.ts) hears it, and the check runs at once. While that
 * stream is up the database is asked only on a ping, on a return to the tab, and in
 * a safety check every 15 minutes of use. Without the stream it falls back to one
 * small request every 30s. Either way, only while the tab is visible and someone has
 * touched it in the last three minutes. A web push the service worker receives while
 * the site is open is passed to the page too (public/sw.js).
 */
export function UnreadWatcher() {
  useEffect(() => {
    let lastActivity = Date.now();
    let timer: number | undefined;
    let cancelled = false;

    const check = (): Promise<void> => {
      if (
        !hasThread() ||
        getChatUiOpen() ||
        window.location.pathname === CHAT_URL
      )
        return Promise.resolve();
      inFlight ??= fetchUnread().finally(() => {
        inFlight = null;
      });
      return inFlight;
    };

    const fetchUnread = async () => {
      lastCheckAt = Date.now();
      try {
        const response = await fetch("/api/chat/unread", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          unread: number;
          hasThread: boolean;
          topic?: string | null;
        };
        if (!data.hasThread) {
          forgetThread();
          setCustomerTopic(null);
          setUnread(0);
          return;
        }
        setCustomerTopic(data.topic);
        const before = getUnread();
        setUnread(data.unread);
        if (data.unread <= before) return;
        // On the site, the pop-up opening IS the alert; a notification on top would
        // announce the same message twice. On the profile, or a hidden tab, notify.
        const popUp = !onProfile();
        if (popUp) openChat();
        if (
          (!popUp || document.visibilityState !== "visible") &&
          storedNotificationsOn()
        ) {
          const n = data.unread;
          void showReplyNotification(
            n === 1
              ? "You have a new message from our team."
              : `You have ${n} new messages from our team.`,
          );
        }
      } catch {
        // Offline: the next check catches up.
      }
    };

    /*
      The timer. While pings are arriving it only runs the rare safety check; the
      moment the stream drops, the 30s fallback resumes on its own.
    */
    const tick = async () => {
      if (cancelled) return;
      const active = Date.now() - lastActivity < IDLE_AFTER_MS;
      // Measured from the last check by ANY watcher, so two mounted ones share a beat.
      const every = isLive(getCustomerTopic()) ? SAFETY_MS : EVERY_MS - 2000;
      const due = Date.now() - lastCheckAt >= every;
      if (document.visibilityState === "visible" && active && due)
        await check();
      if (!cancelled) timer = window.setTimeout(tick, EVERY_MS);
    };

    // A ping on this conversation's topic: the team just wrote. Check now. (After a
    // dropped stream reconnects, live-channel pings everyone once to catch up.)
    const stopLive = watchCustomer(() => void check());

    const markActive = () => {
      const wasIdle = Date.now() - lastActivity >= IDLE_AFTER_MS;
      lastActivity = Date.now();
      if (wasIdle) void check();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastActivity = Date.now();
        void check();
      }
    };

    const onWorkerMessage = (event: MessageEvent) => {
      if ((event.data as { type?: unknown } | null)?.type === "chat-push")
        void check();
    };

    void tick();
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage);
    const ACTIVITY = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
    for (const event of ACTIVITY)
      window.addEventListener(event, markActive, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      stopLive();
      for (const event of ACTIVITY)
        window.removeEventListener(event, markActive);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
    };
  }, []);

  return null;
}
