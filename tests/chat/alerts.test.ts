import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { shouldAlertOperator, messagesUrl } = await import("@/lib/chat/core");
const { alertLines } = await import("@/lib/chat/notify");

describe("when a customer message rings the owner's phone", () => {
  const now = Date.UTC(2026, 9, 30, 12);
  const ago = (minutes: number) => new Date(now - minutes * 60_000);
  it("always for a photo or a file", () => {
    expect(
      shouldAlertOperator({
        hasAttachment: true,
        wasWaiting: true,
        previousCustomerAt: ago(0.1),
        now,
      }),
    ).toBe(true);
  });
  it("for text when nothing was waiting", () => {
    expect(
      shouldAlertOperator({
        hasAttachment: false,
        wasWaiting: false,
        previousCustomerAt: ago(1),
        now,
      }),
    ).toBe(true);
  });
  it("not for the next line of an unread burst", () => {
    expect(
      shouldAlertOperator({
        hasAttachment: false,
        wasWaiting: true,
        previousCustomerAt: ago(2),
        now,
      }),
    ).toBe(false);
  });
  it("again after five quiet minutes", () => {
    expect(
      shouldAlertOperator({
        hasAttachment: false,
        wasWaiting: true,
        previousCustomerAt: ago(5),
        now,
      }),
    ).toBe(true);
  });
});

describe("alert text and links", () => {
  it("writes labelled lines and leaves out empty ones", () => {
    expect(
      alertLines([
        ["Email", "a@b.test"],
        ["Phone", null],
        ["", "Hello"],
      ]),
    ).toBe("Email: a@b.test\nHello");
  });
  it("opens the conversation in the admin inbox", () => {
    expect(messagesUrl("abc123def456")).toBe(
      "/admin/messages?thread=abc123def456",
    );
  });
});
