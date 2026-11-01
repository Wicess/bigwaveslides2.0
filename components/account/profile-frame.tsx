"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ChatUnreadBadge } from "@/components/chat/unread-badge";
import { UnreadWatcher } from "@/components/chat/unread-watcher";
import { useViewportHeight } from "@/components/chat/use-viewport-height";
import { cn } from "@/lib/utils";

/**
 * The profile, as on MIMOSALSD: the whole screen, with no site header, footer or
 * bottom bar. A back button and two tabs: the chat with the team, full screen, and
 * the customer's bookings (quotes, invoices, payments).
 */
export type ProfileSection = "chat" | "bookings";

const SECTIONS: readonly { id: ProfileSection; label: string; href: string }[] =
  [
    { id: "chat", label: "Chat", href: "/account/chat" },
    { id: "bookings", label: "My bookings", href: "/account" },
  ];

export function useProfileBack() {
  const router = useRouter();
  return useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);
}

export function ProfileFrame({
  current,
  children,
}: {
  current: ProfileSection;
  children: React.ReactNode;
}) {
  const back = useProfileBack();
  const chat = current === "chat";
  // The chat follows the keyboard: the frame is the VISIBLE screen, so the
  // composer stays above the keyboard on a phone.
  useViewportHeight(chat);

  // Nothing behind the profile scrolls: not the page, and not the site's smooth
  // scroller (components/motion/lenis-provider.tsx), which drives the page itself.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lenis = (
      window as Window & { __lenis?: { stop(): void; start(): void } }
    ).__lenis;
    lenis?.stop();
    return () => {
      document.body.style.overflow = previous;
      lenis?.start();
    };
  }, []);

  return (
    <div
      data-lenis-prevent
      className="bg-background fixed inset-x-0 top-[var(--app-vv-top,0px)] z-(--z-modal) flex h-[var(--app-vh,100dvh)] flex-col"
    >
      <header className="flex shrink-0 items-center gap-1 px-1.5 pt-[env(safe-area-inset-top)] text-white [background:var(--gradient-deep)]">
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="size-5" />
        </button>
        <nav
          aria-label="Profile"
          className="min-w-0 flex-1 overflow-x-auto py-1.5"
        >
          <ul className="flex gap-1">
            {SECTIONS.map((section) => {
              const active = section.id === current;
              return (
                <li key={section.id}>
                  <Link
                    href={section.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
                      active
                        ? "bg-white/18 text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {section.label}
                    {section.id === "chat" && !active ? (
                      <ChatUnreadBadge className="top-0.5 -right-0.5" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {chat ? (
        <div className="min-h-0 flex-1">{children}</div>
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
      )}
      {/* Replies from the team still count up on the Chat tab while Bookings is open. */}
      {chat ? null : <UnreadWatcher />}
    </div>
  );
}
