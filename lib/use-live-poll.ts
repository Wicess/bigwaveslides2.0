"use client";

import { useEffect, useRef } from "react";

/**
 * Polling that stops when nobody is looking.
 *
 * Every tick of a client-side poll is a serverless invocation, and the order
 * and invoice pages both query Postgres on each one — so an abandoned tab bills
 * a function AND wakes the database, forever. The previous implementations set
 * an interval and never cleared it: they listened for `visibilitychange` only
 * to fire an EXTRA check on return, so a backgrounded tab kept polling at full
 * rate indefinitely. At the payment watcher's 6s cadence that is 600
 * invocations an hour, per tab, for a page the buyer walked away from.
 *
 * This hook keeps the behaviour that matters — a waiting buyer still sees
 * details appear promptly — while removing the cost of one that isn't waiting:
 *
 *   - Hidden tab      -> stop entirely. Nothing to update; nobody can see it.
 *   - Idle (no input) -> stop after `idleMs`. Resumes on the first interaction.
 *   - Return to tab   -> immediate check, then resume the interval.
 *
 * Resuming always fires an immediate check, so coming back is never slower than
 * before — it is faster, because it no longer waits for the next tick.
 */
export function useLivePoll(
  fn: () => void | Promise<void>,
  {
    intervalMs,
    idleMs = 5 * 60_000,
    enabled = true,
  }: { intervalMs: number; idleMs?: number; enabled?: boolean },
) {
  // Keep the latest callback without restarting the interval on every render.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let lastActivity = Date.now();
    let stopped = false;

    const run = () => {
      if (stopped) return;
      void fnRef.current();
    };

    const shouldRun = () =>
      document.visibilityState === "visible" &&
      Date.now() - lastActivity < idleMs;

    const start = (immediate: boolean) => {
      if (timer || stopped) return;
      if (immediate) run();
      timer = setInterval(() => {
        // Re-check each tick: this is what stops an idle-but-visible tab.
        if (!shouldRun()) {
          stop();
          return;
        }
        run();
      }, intervalMs);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const wake = () => {
      lastActivity = Date.now();
      // Immediate check on wake, so returning to the tab is never slower than
      // the old always-on behaviour.
      if (!timer && shouldRun()) start(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") wake();
      else stop();
    };

    // Passive listeners: these fire often and must never block scrolling.
    const opts = { passive: true } as const;
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, wake, opts);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", wake);

    start(true);

    return () => {
      stopped = true;
      stop();
      for (const e of events) window.removeEventListener(e, wake);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", wake);
    };
  }, [intervalMs, idleMs, enabled]);
}
