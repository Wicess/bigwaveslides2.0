// Internal-linking helpers. The goal: weave the whole site together so link
// equity flows between the ranking location pages, the blog, and the product
// catalog. Location data is fully static (lib/locations), so building these
// links costs no database work — safe to call on every programmatic page.

import { US_STATES, getPriorityCities } from "@/lib/locations";

/** Stable string → uint hash, so each page deterministically picks the same
    "random" set on every render (no Math.random → cache-safe, no layout jump). */
export function hashSeed(str: string): number {
  return [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
}

/** Deterministically pick `count` items from `arr`, offset by `seed`, in order
    and without repeats. Returns the whole array if it's shorter than `count`. */
export function pickN<T>(arr: readonly T[], seed: number, count: number): T[] {
  if (arr.length <= count) return [...arr];
  const start = seed % arr.length;
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(arr[(start + i) % arr.length]!);
  return out;
}

export type ServiceAreaLink = { href: string; label: string };

/**
 * A deterministic spread of location links (priority metros + a couple of state
 * hubs) for a blog post or product page to link to — so equity flows toward the
 * pages that already rank, and every post sends it to a different mix.
 */
export function serviceAreaLinks(
  seed: number,
  cityCount = 6,
  stateCount = 2,
): ServiceAreaLink[] {
  const cities = pickN(getPriorityCities(), seed, cityCount).map((c) => ({
    href: `/water-slide-rentals/${c.state.slug}/${c.slug}`,
    label: `${c.name}, ${c.state.abbr}`,
  }));
  const states = pickN(US_STATES, seed * 7 + 3, stateCount).map((s) => ({
    href: `/water-slide-rentals/${s.slug}`,
    label: s.name,
  }));
  return [...cities, ...states];
}
