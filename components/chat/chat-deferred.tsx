"use client";

import { Suspense, lazy, useEffect, useState } from "react";

/*
  The live chat, loaded once the page is idle so it never competes with the page's
  own first paint. The widget and the unread watcher come in their own chunk.
*/
const ChatWidget = lazy(() =>
  import("@/components/chat/chat-widget").then((m) => ({
    default: m.ChatWidget,
  })),
);
const UnreadWatcher = lazy(() =>
  import("@/components/chat/unread-watcher").then((m) => ({
    default: m.UnreadWatcher,
  })),
);

function useIdle(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as unknown as {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const handle = w.requestIdleCallback(() => setReady(true), {
        timeout: 1500,
      });
      return () => w.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(timer);
  }, []);
  return ready;
}

export function ChatDeferred() {
  const ready = useIdle();
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <ChatWidget />
      <UnreadWatcher />
    </Suspense>
  );
}
