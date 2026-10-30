/**
 * The live chat's anonymous visitor cookie: how a returning visitor finds their
 * conversation again.
 *
 * It is a random id and nothing else. It is also what chat uses to find a
 * visitor's thread, which makes it a bearer value: never render it in full, and
 * never put it in a URL (the admin addresses visitors by row id instead).
 *
 * Plain module, no server-only imports: the proxy reads and mints it.
 */
// The chat's own identity cookie. Separate from analytics' bws_vid, which can hold a
// fingerprint rather than a UUID and must not be overwritten by the chat.
export const VISITOR_COOKIE = "sr_chat_vid";
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 90;

const VISITOR_ID = /^[0-9a-f-]{36}$/i;

export function isVisitorId(value: string | null | undefined): value is string {
  return typeof value === "string" && VISITOR_ID.test(value);
}
