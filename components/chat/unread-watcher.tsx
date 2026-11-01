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

const EVERY_MS = 30_000;
const IDLE_AFTER_MS = 3 * 60_000;

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
 * conversation; otherwise one small request every 30s, only while the tab is visible
 * and someone has touched it in the last three minutes, plus one catch-up when they
 * come back to it. A web push the service worker receives while the site is open is
 * passed to the page (public/sw.js), so the check runs the moment a reply is sent.
 */
export function UnreadWatcher() {
  useEffect(() => {
    let lastActivity = Date.now();
    let timer: number | undefined;
    let cancelled = false;

    const check = async () => {
      if (
        !hasThread() ||
        getChatUiOpen() ||
        window.location.pathname === CHAT_URL
      )
        return;
      try {
        const response = await fetch("/api/chat/unread", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          unread: number;
          hasThread: boolean;
        };
        if (!data.hasThread) {
          forgetThread();
          setUnread(0);
          return;
        }
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

    const tick = async () => {
      if (cancelled) return;
      const active = Date.now() - lastActivity < IDLE_AFTER_MS;
      if (document.visibilityState === "visible" && active) await check();
      if (!cancelled) timer = window.setTimeout(tick, EVERY_MS);
    };

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
      for (const event of ACTIVITY)
        window.removeEventListener(event, markActive);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
    };
  }, []);

  return null;
}
