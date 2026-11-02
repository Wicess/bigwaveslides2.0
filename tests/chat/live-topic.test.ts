import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { staffTopic, threadTopic } = await import("@/lib/chat/live-topic");

describe("the live-chat ntfy topics", () => {
  it("are stable per thread, unguessable-looking and valid ntfy names", () => {
    const a = threadTopic("thread-a");
    expect(a).toMatch(/^srl-[0-9a-f]{40}$/);
    expect(threadTopic("thread-a")).toBe(a);
    expect(threadTopic("thread-b")).not.toBe(a);
    expect(a!.length).toBeLessThanOrEqual(64);
  });

  it("never carry the thread id itself", () => {
    expect(threadTopic("cmabc123")).not.toContain("cmabc123");
  });

  it("give the inbox its own topic, apart from every thread's", () => {
    const staff = staffTopic();
    expect(staff).toMatch(/^srs-[0-9a-f]{40}$/);
    expect(staff).not.toBe(threadTopic("chat-staff"));
  });

  it("have no topic without a thread", () => {
    expect(threadTopic(null)).toBeNull();
    expect(threadTopic("")).toBeNull();
  });
});
