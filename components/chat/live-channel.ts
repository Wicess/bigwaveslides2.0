"use client";

/**
 * ONE shared EventSource to ntfy.sh for the whole page, carrying the empty "something
 * changed" pings the server publishes (lib/chat/live-topic.ts).
 *
 * Why: Neon bills every hour the database is awake and only sleeps after five
 * minutes with zero queries. A chat that checks the database on a timer keeps it up
 * for as long as somebody has a tab open. The stream costs the database nothing; the
 * database is asked only when a ping says there is something to fetch.
 *
 * Every consumer — the unread watcher, an open chat panel, the profile chat, the admin
 * inbox — registers here for a topic, and they all share one connection
 * (`https://ntfy.sh/<topic>[,<topic>]/sse`). The stream is open only while somebody
 * is there:
 *
 *   · tab visible and touched in the last 3 minutes  → open
 *   · tab hidden, or no interaction for 3 minutes    → closed (each consumer does its
 *                                                      own catch-up when they return)
 *   · an open chat with reply notifications on may hold it open while hidden for a
 *     short window (holdLiveWhileHidden), in place of the old hidden-tab polling
 *
 * Activity is pointerdown / keydown / touchstart / wheel, plus returning to the tab.
 * Never "scroll": auto-moving carousels fire it forever and would keep everything on.
 *
 * When the stream will not connect (blocked network, ntfy down), `isLive()` stays
 * false and every consumer simply falls back to its timer.
 */

const SERVER = "https://ntfy.sh";
const IDLE_AFTER_MS = 3 * 60_000;
/** Consecutive failed attempts before giving up for a while and leaving it to the timers. */
const MAX_FAILURES = 4;
const RETRY_AFTER_MS = 5 * 60_000;
const ACTIVITY = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

type Listener = () => void;

const byTopic = new Map<string, Set<Listener>>();
const statusListeners = new Set<Listener>();

let source: EventSource | null = null;
let sourceTopics: readonly string[] = [];
let connected = false;
let failures = 0;
let hadError = false;
let lastActivity = Date.now();
let hiddenHoldUntil = 0;
let deadlineTimer: number | undefined;
let retryTimer: number | undefined;
let wired = false;

function setConnected(next: boolean): void {
  if (connected === next) return;
  connected = next;
  for (const listener of statusListeners) listener();
}

function emit(topic: string | undefined): void {
  const targets = topic ? [topic] : [...byTopic.keys()];
  for (const t of targets)
    for (const listener of [...(byTopic.get(t) ?? [])]) listener();
}

function wanted(): string[] {
  return [...byTopic.keys()].filter((t) => byTopic.get(t)!.size > 0).sort();
}

function present(): boolean {
  if (document.visibilityState === "visible")
    return Date.now() - lastActivity < IDLE_AFTER_MS;
  return Date.now() < hiddenHoldUntil;
}

function close(): void {
  if (source) {
    source.close();
    source = null;
  }
  sourceTopics = [];
  setConnected(false);
}

function open(topics: readonly string[]): void {
  const es = new EventSource(
    `${SERVER}/${topics.map(encodeURIComponent).join(",")}/sse`,
  );
  source = es;
  sourceTopics = topics;
  es.onopen = () => {
    if (source !== es) return;
    const recovered = hadError;
    hadError = false;
    failures = 0;
    setConnected(true);
    // Back after a dropped connection: a ping may have been missed meanwhile.
    if (recovered) emit(undefined);
  };
  // ntfy names its "open" and "keepalive" events, so only real pings arrive here.
  es.onmessage = (event: MessageEvent<string>) => {
    if (source !== es) return;
    let topic: string | undefined;
    try {
      const data = JSON.parse(event.data) as { event?: string; topic?: string };
      if (data.event && data.event !== "message") return;
      topic = typeof data.topic === "string" ? data.topic : undefined;
    } catch {
      return;
    }
    emit(topic);
  };
  es.onerror = () => {
    if (source !== es) return;
    hadError = true;
    failures += 1;
    setConnected(false);
    // The browser retries on its own while CONNECTING; stop it once it keeps failing.
    if (es.readyState === EventSource.CLOSED || failures >= MAX_FAILURES) {
      close();
      if (retryTimer === undefined)
        retryTimer = window.setTimeout(() => {
          retryTimer = undefined;
          failures = 0;
          reconcile();
        }, RETRY_AFTER_MS);
    }
  };
}

function reconcile(): void {
  const topics = wanted();
  if (
    topics.length === 0 ||
    typeof EventSource === "undefined" ||
    failures >= MAX_FAILURES ||
    !present()
  ) {
    close();
    return;
  }
  if (source && topics.join(",") === sourceTopics.join(",")) {
    armDeadline();
    return;
  }
  close();
  open(topics);
  armDeadline();
}

/** Close the stream the moment the visitor counts as gone (idle, or the hidden hold ends). */
function armDeadline(): void {
  if (deadlineTimer !== undefined) return;
  const deadline =
    document.visibilityState === "visible"
      ? lastActivity + IDLE_AFTER_MS
      : hiddenHoldUntil;
  deadlineTimer = window.setTimeout(
    () => {
      deadlineTimer = undefined;
      if (present()) armDeadline();
      else reconcile();
    },
    Math.max(1000, deadline - Date.now()),
  );
}

function onActivity(): void {
  const wasAway = !source;
  lastActivity = Date.now();
  if (wasAway) reconcile();
}

function onVisibility(): void {
  if (deadlineTimer !== undefined) {
    window.clearTimeout(deadlineTimer);
    deadlineTimer = undefined;
  }
  if (document.visibilityState === "visible") lastActivity = Date.now();
  reconcile();
}

function wire(): void {
  if (wired || typeof window === "undefined") return;
  wired = true;
  for (const event of ACTIVITY)
    window.addEventListener(event, onActivity, { passive: true });
  window.addEventListener("focus", onActivity);
  document.addEventListener("visibilitychange", onVisibility);
}

/** Be told whenever `topic` is pinged. Returns the unsubscribe. */
export function watchLive(topic: string, listener: Listener): () => void {
  wire();
  let set = byTopic.get(topic);
  if (!set) byTopic.set(topic, (set = new Set()));
  set.add(listener);
  reconcile();
  return () => {
    const current = byTopic.get(topic);
    current?.delete(listener);
    if (current && current.size === 0) byTopic.delete(topic);
    reconcile();
  };
}

/** Whether pings for `topic` are arriving right now (so timers can stand down). */
export function isLive(topic: string | null | undefined): boolean {
  return Boolean(topic) && connected && sourceTopics.includes(topic!);
}

export function subscribeLiveStatus(listener: Listener): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Keep the stream open while the tab is hidden, until `until` (epoch ms). Used by an
 * open chat with reply notifications on, so a reply they are waiting for still
 * arrives — from a ping instead of a hidden-tab poll of the database. 0 cancels.
 */
export function holdLiveWhileHidden(until: number): void {
  hiddenHoldUntil = until;
  if (deadlineTimer !== undefined) {
    window.clearTimeout(deadlineTimer);
    deadlineTimer = undefined;
  }
  if (typeof document !== "undefined") reconcile();
}

/* ── The customer's own conversation ─────────────────────────────────────────── */

/*
  The customer's topic is learned from /api/chat/unread or /api/chat/poll, whichever
  answers first, and shared by the watcher and an open chat so both ride the same
  connection and follow the topic if it changes (a deleted conversation, a new one).
*/
let customerTopic: string | null = null;
const customerListeners = new Set<Listener>();
let customerRelay: (() => void) | null = null;

function relayCustomer(): void {
  for (const listener of [...customerListeners]) listener();
}

function rebindCustomer(): void {
  customerRelay?.();
  customerRelay = null;
  if (customerTopic && customerListeners.size > 0)
    customerRelay = watchLive(customerTopic, relayCustomer);
}

export function setCustomerTopic(topic: string | null | undefined): void {
  const next = topic || null;
  if (next === customerTopic) return;
  customerTopic = next;
  rebindCustomer();
}

export function getCustomerTopic(): string | null {
  return customerTopic;
}

/** Be told whenever the team writes in this visitor's conversation. */
export function watchCustomer(listener: Listener): () => void {
  customerListeners.add(listener);
  if (customerListeners.size === 1) rebindCustomer();
  return () => {
    customerListeners.delete(listener);
    if (customerListeners.size === 0) rebindCustomer();
  };
}
