"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Undo2 } from "lucide-react";
import { setVisitorIsBot } from "@/server/actions/admin-analytics";

/**
 * Hide a visitor from the "Human visitors" list, or put it back.
 *
 * Automatic detection settles the obvious cases; this covers the crawlers that
 * arrive on a convincing desktop user agent, where only a person reading the
 * timeline can tell. Marking one writes device = BOT, so it drops straight out
 * of the default list and shows up under "Show bots".
 */
export function VisitorBotToggle({
  id,
  isBot,
}: {
  id: string;
  isBot: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await setVisitorIsBot({ id, isBot: !isBot });
      if (res.ok) router.refresh();
      else setError(res.error ?? "Could not update this visitor.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="border-border text-foreground/70 hover:border-primary/40 hover:text-primary inline-flex h-10 items-center gap-1.5 rounded-full border bg-white px-3.5 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {isBot ? (
          <>
            <Undo2 className="size-4" />
            {pending ? "Restoring…" : "Not a bot"}
          </>
        ) : (
          <>
            <Bot className="size-4" />
            {pending ? "Hiding…" : "Mark as bot"}
          </>
        )}
      </button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </div>
  );
}
