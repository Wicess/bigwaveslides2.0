"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { BRAND } from "@/lib/chat/brand";
import { PresenceDot } from "@/components/chat/presence-dot";
import {
  AttachmentViewer,
  type ViewerItem,
} from "@/components/chat/attachment-viewer";
import {
  AlertIcon,
  BellIcon,
  CheckIcon,
  CrossIcon,
  PaperclipIcon,
  SendIcon,
  ShieldIcon,
  SmileIcon,
} from "@/components/chat/icons";
import { EmojiTray } from "./emoji-tray";
import { useChat, type ChatMessage } from "./use-chat";
import { preparePush, usePushStatus } from "@/components/chat/push-client";

/**
 * The conversation.
 *
 * Ported from WHAM's `chat-panel.tsx`: tailed bubbles, a day separator, one tick on
 * the customer's own messages, photos inline, the quotable reference pill, and a
 * failed message that stays on screen with a retry rather than vanishing.
 *
 * Rebuilt on this project's semantic tokens rather than WHAM's hard-coded zinc and
 * brand-blue, so it follows the site into dark mode instead of glowing white in it.
 */

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function Bubble({
  m,
  onRetry,
  onMedia,
  onOpen,
}: {
  m: ChatMessage;
  onRetry: (m: ChatMessage) => void;
  /** A photo finished loading and grew the list. */
  onMedia: () => void;
  /** Open a photo, an invoice or a file in the on-site viewer. */
  onOpen: (item: ViewerItem) => void;
}) {
  if (m.sender === "SYSTEM") {
    return (
      <div className="flex justify-center px-2">
        <p className="text-foreground-muted max-w-[92%] rounded-2xl bg-white px-4 py-3 text-center text-[13px] leading-relaxed whitespace-pre-wrap ring-1 ring-[#003366]/8">
          {m.body}
        </p>
      </div>
    );
  }

  const mine = m.sender === "CUSTOMER";
  const isImage = m.attachment?.type.startsWith("image/");
  const src =
    m.localPreview ?? (m.pending ? undefined : `/api/chat/attachment/${m.id}`);

  return (
    <div
      className={`flex ${mine ? "justify-end" : "justify-start"} motion-safe:animate-[fade-in_180ms_ease-out]`}
    >
      <div
        className={`flex max-w-[82%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
      >
        <div
          className={[
            "overflow-hidden text-[15px] leading-relaxed",
            // The tail: the corner nearest the sender squares off.
            mine
              ? // The site's deep blues, not the bright primary: white text on #0099ff
                // falls short of comfortable contrast, on this gradient it does not.
                "rounded-[20px] rounded-br-md text-white shadow-[0_6px_16px_-8px_rgba(0,51,102,0.45)] [background:linear-gradient(135deg,#0a4d8c_0%,#0077cc_100%)]"
              : "border-border bg-surface text-foreground rounded-[20px] rounded-bl-md border",
            m.failed ? "opacity-70" : "",
          ].join(" ")}
        >
          {m.attachment && isImage && src ? (
            // Opens on the site, never in a new tab: closing it comes back here.
            <button
              type="button"
              onClick={() =>
                onOpen({
                  src,
                  name: m.attachment!.name,
                  image: true,
                  ...(m.pending ? {} : { messageId: m.id }),
                })
              }
              aria-label={`View ${m.attachment.name}`}
              className="block cursor-zoom-in"
            >
              {/* A signed, short-lived URL or a local blob — nothing for next/image to optimise. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={m.attachment.name}
                onLoad={onMedia}
                className="max-h-72 w-full max-w-[260px] object-cover object-top"
              />
            </button>
          ) : null}
          {m.attachment && !isImage ? (
            <button
              type="button"
              disabled={m.pending}
              onClick={() =>
                onOpen({
                  src: `/api/chat/attachment/${m.id}`,
                  name: m.attachment!.name,
                  image: false,
                  messageId: m.id,
                })
              }
              className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left underline underline-offset-4"
            >
              <PaperclipIcon className="size-4 shrink-0" />
              <span className="truncate">{m.attachment.name}</span>
            </button>
          ) : null}
          {m.body ? (
            <p className="px-4 py-2.5 break-words whitespace-pre-wrap">
              {m.body}
            </p>
          ) : null}
        </div>

        <span className="text-foreground-subtle flex items-center gap-1 px-1.5 text-[11px] tabular-nums">
          {m.failed ? (
            <button
              type="button"
              onClick={() => onRetry(m)}
              className="text-danger-fg inline-flex min-h-8 items-center gap-1 font-medium"
            >
              <AlertIcon className="size-3" /> Not sent — tap to retry
            </button>
          ) : m.pending ? (
            "Sending…"
          ) : (
            <>
              {timeLabel(m.createdAt)}
              {m.edited ? <span className="italic">· edited</span> : null}
              {/*
                ONE tick, never two. A customer is told their message arrived — never
                the moment the shop read it and had not yet replied.
              */}
              {mine && m.receipt === "delivered" ? (
                <CheckIcon
                  className="text-accent-fg size-3.5"
                  aria-label="Received"
                />
              ) : null}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

/** Enough to catch a typo before the server's own check; the server validates properly. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChatPanel({
  open,
  onClose,
  variant = "widget",
}: {
  open: boolean;
  onClose: () => void;
  /** `page`: the full-screen profile chat, which has its own back button instead of a close. */
  variant?: "widget" | "page";
}) {
  const {
    messages,
    loading,
    sending,
    send,
    sendFile,
    reportTyping,
    publicId,
    hasEmail,
    notificationsOn,
    notificationsSupported,
    enableNotifications,
    disableNotifications,
  } = useChat({ open });
  const [notifyNote, setNotifyNote] = useState<string | null>(null);
  // The photo, invoice or file open in the on-site viewer.
  const [viewing, setViewing] = useState<ViewerItem | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);
  const pushStatus = usePushStatus();
  // Warm the push set-up as the bell appears, so the tap itself has nothing to wait for.
  useEffect(() => {
    void preparePush();
  }, []);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 128)}px`;
  }, [draft]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Whether the reader is at the newest message. A photo that finishes loading
  // grows the list after the scroll; this is how it knows to follow.
  const atBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const emailId = useId();

  const firstContact = messages.length === 0;
  /*
    An email before the first message or file (owner, 2026-10-17). Asked only while the
    conversation has none: one started at checkout or from a form already does. The
    server refuses without it as well, so this is the friendly half of the rule.
  */
  const needsEmail = !loading && !hasEmail;
  const emailValid = EMAIL.test(email.trim());
  const blocked = needsEmail && !emailValid;

  // Newest message in view. Layout effect, so it lands before paint and the list
  // never flashes at the top first.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
    atBottomRef.current = true;
  }, [messages.length]);

  const followMedia = () => {
    const list = listRef.current;
    if (list && atBottomRef.current) list.scrollTop = list.scrollHeight;
  };

  useEffect(() => {
    if (!open) return;
    if (needsEmail && !emailValid) emailRef.current?.focus();
    else inputRef.current?.focus();
    // Only on opening: moving focus as the email becomes valid would yank the keyboard.
  }, [open]);

  function askForEmail(): void {
    setEmailError("Enter your email to start the chat.");
    emailRef.current?.focus();
  }

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    if (blocked) return askForEmail();
    setDraft("");
    setShowEmoji(false);
    reportTyping("");
    const sent = await send(
      text,
      needsEmail ? { email: email.trim() } : undefined,
    );
    if (!sent && needsEmail) {
      setDraft(text);
      askForEmail();
    }
  }

  async function pick(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (blocked) {
      if (fileRef.current) fileRef.current.value = "";
      return askForEmail();
    }
    const error = await sendFile(
      file,
      draft,
      needsEmail ? email.trim() : undefined,
    );
    if (error) setFileError(error);
    else setDraft("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="bg-background flex h-full min-h-0 flex-col"
    >
      {/* The header in the site's deep ocean gradient (--gradient-deep). */}
      {/* touch-none: on a phone the header is the card's drag handle (chat-widget.tsx). */}
      <header className="relative flex shrink-0 touch-none items-center gap-3 px-4 py-3 text-white [background:var(--gradient-deep)]">
        {variant === "widget" ? (
          <span
            aria-hidden
            className="absolute top-1.5 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-white/35 md:hidden"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          {/* The logo, above "Admin online" (owner, 2026-11-01): the brand tile and the
              wordmark in the brand font, light on the deep-blue header. */}
          <h2 id={titleId} className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/splash-republic-mark.svg"
              alt=""
              width={34}
              height={34}
              className="size-[34px] rounded-[10px] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.45)] ring-1 ring-white/35"
            />
            <span aria-hidden className="flex flex-col leading-none">
              <span className="font-brand text-[17px] font-bold tracking-[0.03em] text-white">
                SPLASH
              </span>
              <span className="font-brand mt-[3px] text-[8.5px] font-semibold tracking-[0.46em] text-white/85">
                REPUBLIC
              </span>
            </span>
            <span className="sr-only">{BRAND.name}</span>
          </h2>
          {/*
            Always "Admin online" (owner, 2026-09-14): the owner is notified of every
            message on their phone and answers straight away, so customers should
            feel free to write. It is the design of the header, not a status read
            from anywhere, so it costs no request and no database query. The words say
            it as well as the light (WCAG 1.4.1).
          */}
          <p className="mt-1 flex items-center gap-2.5 text-xs">
            <PresenceDot online blink />
            <span className="font-medium tracking-wide text-[#86efac]">
              Admin online
            </span>
          </p>
        </div>
        {notificationsSupported || pushStatus === "needs-install" ? (
          <button
            type="button"
            aria-pressed={notificationsOn}
            onClick={async () => {
              if (notificationsOn) {
                disableNotifications();
                setNotifyNote("Reply notifications are off.");
                return;
              }
              const result = await enableNotifications();
              setNotifyNote(
                result === "granted"
                  ? "We will notify you when the team replies."
                  : result === "needs-install"
                    ? "On iPhone, add Splash Republic to your Home Screen first — the steps are open."
                    : result === "unsupported"
                      ? "This browser cannot show notifications."
                      : "Notifications are blocked in your browser settings.",
              );
            }}
            aria-label={
              notificationsOn
                ? "Turn off reply notifications"
                : "Notify me when the team replies"
            }
            title={
              notificationsOn
                ? "Reply notifications on"
                : "Notify me when the team replies"
            }
            className={`relative inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/12 ${
              notificationsOn ? "text-white" : "text-white/75 hover:text-white"
            }`}
          >
            <BellIcon className="size-5" />
            {notificationsOn ? (
              <span
                aria-hidden
                className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#7fe9ff] ring-2 ring-[#003366]"
              />
            ) : null}
          </button>
        ) : null}
        {variant === "widget" ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="inline-flex size-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/12 hover:text-white"
          >
            <CrossIcon className="size-5" />
          </button>
        ) : null}
      </header>
      {notifyNote ? (
        <p
          role="status"
          className="border-border bg-surface-sunken text-foreground-muted shrink-0 border-b px-4 py-2 text-xs"
        >
          {notifyNote}
        </p>
      ) : null}

      <div
        ref={listRef}
        onScroll={() => {
          const list = listRef.current;
          if (list)
            atBottomRef.current =
              list.scrollHeight - list.scrollTop - list.clientHeight < 80;
        }}
        className="scrollbar-touch-hidden min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-[#f5f9fd] px-3 py-4"
      >
        {loading && messages.length === 0 ? (
          <div className="space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`flex ${i === 1 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`bg-surface-sunken h-10 animate-pulse rounded-[20px] ${i === 1 ? "w-40" : "w-52"}`}
                />
              </div>
            ))}
          </div>
        ) : firstContact ? (
          <div className="flex min-h-full flex-col justify-center px-2">
            <div className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]">
                <SendIcon className="size-5" />
              </span>
              <p className="font-product text-foreground mt-3 text-base font-medium">
                How can we help?
              </p>
              <p className="text-foreground-muted mx-auto mt-1.5 max-w-[34ch] text-[13px] leading-relaxed">
                Ask about a product, an order or where we ship. A person reads
                every message.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const previous = messages[i - 1];
            const newDay =
              !previous ||
              new Date(previous.createdAt).toDateString() !==
                new Date(m.createdAt).toDateString();
            return (
              <div key={m.id} className={newDay ? "space-y-2 pt-1" : ""}>
                {newDay ? (
                  <div className="flex justify-center py-1">
                    <span className="bg-surface text-foreground-muted ring-border rounded-full px-3 py-1 text-[11px] font-medium ring-1">
                      {dayLabel(m.createdAt)}
                    </span>
                  </div>
                ) : null}
                <Bubble
                  m={m}
                  onRetry={(failed) => void send(failed.body)}
                  onMedia={followMedia}
                  onOpen={setViewing}
                />
              </div>
            );
          })
        )}
        {publicId && !firstContact ? (
          <p className="text-foreground-subtle pt-2 text-center text-[11px]">
            Reference{" "}
            <span className="tabular text-foreground-muted font-medium">
              {publicId}
            </span>
          </p>
        ) : null}
      </div>

      <form
        onSubmit={submit}
        className="border-border bg-surface relative shrink-0 border-t px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        {showEmoji ? (
          <EmojiTray
            className="absolute bottom-full left-3 mb-1"
            onClose={() => setShowEmoji(false)}
            onPick={(emoji) => {
              setDraft((d) => d + emoji);
              inputRef.current?.focus();
            }}
          />
        ) : null}
        {needsEmail ? (
          <div className="mb-2">
            <label
              htmlFor={emailId}
              className="text-foreground-muted mb-1.5 block px-1 text-[12px] font-medium"
            >
              Your email, to start the chat. We reply here and by email, and
              you&apos;ll get our newsletter (unsubscribe anytime).
            </label>
            <input
              ref={emailRef}
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? `${emailId}-error` : undefined}
              placeholder="you@example.com"
              className={`bg-background text-foreground placeholder:text-foreground-subtle min-h-11 w-full rounded-2xl border px-4 text-[16px] md:text-sm ${
                emailError ? "border-danger-fg" : "border-border-strong"
              }`}
            />
            {emailError ? (
              <p
                id={`${emailId}-error`}
                role="alert"
                className="text-danger-fg mt-1.5 px-1 text-[12px] font-medium"
              >
                {emailError}
              </p>
            ) : null}
          </div>
        ) : null}

        {fileError ? (
          <p
            role="alert"
            className="text-danger-fg mb-2 text-[12px] font-medium"
          >
            {fileError}
          </p>
        ) : null}

        <div className="bg-surface-sunken flex items-end gap-2 rounded-[24px] p-1.5 focus-within:ring-2 focus-within:ring-[var(--ring)]">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => (blocked ? askForEmail() : fileRef.current?.click())}
            disabled={sending}
            aria-label="Attach a photo or PDF"
            className="bg-surface text-foreground-muted hover:text-foreground grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-40"
          >
            <PaperclipIcon className="size-4" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowEmoji((v) => !v)}
            aria-label="Add emoji"
            aria-expanded={showEmoji}
            className="bg-surface text-foreground-muted hover:text-foreground hidden size-11 shrink-0 place-items-center rounded-full md:grid"
          >
            <SmileIcon className="size-4" />
          </button>
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            maxLength={4000}
            onChange={(e) => {
              setDraft(e.target.value);
              reportTyping(e.target.value);
            }}
            // Enter (and the phone keyboard's return key) makes a new line. Only the Send
            // button sends — the owner's rule: a half-written message must never go out
            // because someone reached for the next line.
            enterKeyHint="enter"
            placeholder="Write a message"
            aria-label="Message"
            // 16px on phones stops iOS zooming the page when the field takes focus.
            // The pill around it draws the focus ring; the global :focus-visible outline is
            // unlayered, so it takes `!` to stop a second ring appearing inside the first.
            className="text-foreground placeholder:text-foreground-subtle max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[16px] leading-snug outline-none! md:text-[15px]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending || blocked}
            aria-label="Send message"
            className="grid size-11 shrink-0 place-items-center rounded-full text-white shadow-[0_6px_16px_-6px_rgba(0,51,102,0.5)] transition-[transform,opacity] duration-200 [background:var(--gradient-deep)] active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            <SendIcon className="size-4" />
          </button>
        </div>

        <p className="text-foreground-subtle mt-2 flex items-center justify-center gap-1.5 text-[10px]">
          <ShieldIcon className="size-3" />
          Private, encrypted chat. Only our team and you see these messages.
        </p>
      </form>
      <AttachmentViewer item={viewing} onClose={closeViewer} />
    </section>
  );
}
