"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  closeChat,
  getChatUiOpen,
  getChatUiServerSnapshot,
  openChat,
  subscribeChatUi,
} from "@/lib/chat/chat-ui";
import { ChatIcon } from "@/components/chat/icons";
import { ChatPanel } from "./chat-panel";
import { ChatUnreadBadge } from "./unread-badge";
import { useViewportHeight } from "./use-viewport-height";

/**
 * Live chat — the launcher and the frame around the conversation.
 *
 * Replaces the canned-reply "quick chat" with WHAM's two-way chat.
 *
 * DESKTOP: WHAM's floating launcher, bottom-right, opening a corner card.
 *
 * PHONE: no floating bubble. WHAM floats one there too, and in WHAM's own screenshot
 * it sits on top of the BUY NOW button. This site already decided the thumb zone
 * belongs to the tab bar and the sticky Add-to-Cart, so on a phone chat is a fifth
 * tab (see ChatTab) and opens as a full-screen sheet — a conversation needs the whole
 * screen for its keyboard anyway.
 *
 * Mounted lazily after the browser goes idle (components/ui/deferred.tsx), so none
 * of this is on the critical path. A Chat-tab tap that lands before the code arrives
 * is held in the shared store and honoured on mount.
 */
export function ChatWidget() {
  const open = useSyncExternalStore(
    subscribeChatUi,
    getChatUiOpen,
    getChatUiServerSnapshot,
  );

  // WHAM's deep link: an alert or an email can open `/?openchat=1` straight onto the
  // conversation. The parameter is then stripped so a refresh or a shared link does
  // not keep re-opening it.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("openchat") === "1") {
      openChat();
      url.searchParams.delete("openchat");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  // Sizes the phone panel to what the keyboard leaves visible, so the conversation
  // scrolls above the typing field instead of the field being pushed off screen.
  useViewportHeight(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeChat();
    window.addEventListener("keydown", onKey);
    // On a phone the panel sits over the page; the page behind it must not scroll.
    const phone = window.matchMedia("(max-width: 767px)").matches;
    // Splash Republic's smooth scroller (components/motion/lenis-provider.tsx) drives
    // the page itself, so locking <body> alone would not hold the page still behind
    // the chat on a phone. Pause it while the chat is open there.
    const lenis = (
      window as Window & { __lenis?: { stop(): void; start(): void } }
    ).__lenis;
    if (phone) {
      document.body.style.overflow = "hidden";
      lenis?.stop();
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      if (phone) {
        document.body.style.overflow = "";
        lenis?.start();
      }
    };
  }, [open]);

  /*
    A smooth open AND close. The card stays mounted for its exit, so closing plays
    the same motion in reverse instead of vanishing; the launcher returns after it.
    Reduced motion: no animation and no delay.
  */
  const [shown, setShown] = useState(open);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (open) {
      setShown(true);
      setLeaving(false);
      return;
    }
    if (!shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(false);
      return;
    }
    setLeaving(true);
    // The card is removed when its exit animation ENDS (onAnimationEnd below), so a
    // slow phone still sees the whole motion. This timer is only a backstop, in case
    // the animation never runs (a hidden tab, for example).
    const timer = window.setTimeout(() => {
      setShown(false);
      setLeaving(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [open, shown]);

  const onCardAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (!leaving || event.target !== event.currentTarget) return;
    setShown(false);
    setLeaving(false);
  };

  return (
    <>
      {!shown ? (
        <button
          type="button"
          onClick={openChat}
          aria-label="Chat with us"
          // Splash Republic has no bottom tab bar, so the button shows on phones too:
          // a round icon there, the labelled pill from md. It sits above the explore
          // bar, in the site's own ocean gradient (as the Rent Now button).
          className="fixed right-4 bottom-[calc(1.25rem+var(--explore-bar-h,0px))] z-(--z-drawer) inline-flex size-14 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-[var(--shadow-glow)] ring-1 ring-white/25 transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-expo)] [background:var(--gradient-wave)] hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-10px_rgba(0,153,255,0.6)] active:scale-95 motion-safe:animate-[chat-launcher-in_320ms_var(--ease-out-expo)] motion-reduce:transition-none sm:bottom-6 md:size-auto md:min-h-12 md:px-5"
        >
          <ChatIcon className="size-6 md:size-5" />
          <span className="hidden md:inline">Chat with us</span>
          <ChatUnreadBadge className="-top-1.5 -right-1.5" />
        </button>
      ) : null}

      {shown ? (
        <>
          {/* Phone: the site stays visible beside the panel; tapping it closes the chat. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close chat"
            onClick={closeChat}
            className={`fixed inset-0 z-(--z-drawer) cursor-default bg-[#001a33]/45 backdrop-blur-[2px] md:hidden ${
              leaving
                ? "motion-safe:animate-[fade-out_200ms_ease-in_forwards]"
                : "motion-safe:animate-[fade-in_240ms_ease-out]"
            }`}
          />
          {/* data-lenis-prevent: the site's smooth scrolling must not swallow the chat's own scroll. */}
          <div
            data-lenis-prevent
            onAnimationEnd={onCardAnimationEnd}
            className={[
              "bg-background fixed z-(--z-drawer) origin-bottom-right overflow-hidden",
              "shadow-[0_28px_70px_-24px_rgba(0,51,102,0.55)] ring-1 ring-[#003366]/10",
              // Phone: a card above the keyboard, sized by .chat-card in globals.css.
              // Desktop: a corner card, shorter than before (owner, 2026-10-31).
              "chat-card right-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl",
              "md:top-auto md:right-5 md:bottom-5 md:h-[min(560px,calc(100dvh-2.5rem))] md:w-[372px]",
              leaving
                ? "motion-safe:animate-[chat-out_200ms_ease-in_forwards]"
                : "motion-safe:animate-[chat-in_320ms_var(--ease-out-expo)]",
            ].join(" ")}
          >
            <ChatPanel open={shown} onClose={closeChat} />
          </div>
        </>
      ) : null}
    </>
  );
}
