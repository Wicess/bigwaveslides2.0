// lib/utils.ts
// -----------------------------------------------------------------------------
// Tiny helper used all over the app's React components to build a CSS class
// string for the `className` prop. It combines two libraries:
//   - clsx: turns a mix of strings, arrays, and conditional objects
//           (e.g. { "is-active": true }) into one space-separated class string.
//   - tailwind-merge: removes Tailwind conflicts so the LAST class wins.
// Used wherever a component needs conditional or merged Tailwind classes.
// -----------------------------------------------------------------------------
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely (dedupes conflicting utilities).
 *
 * Why both libraries? clsx flattens/joins the inputs and handles conditionals,
 * but it does NOT understand Tailwind. So `clsx("p-2", "p-4")` would output
 * BOTH "p-2 p-4", and the result depends on CSS order. twMerge knows these
 * conflict and keeps only the last one ("p-4"), so callers can safely override
 * earlier classes by passing a new one later.
 *
 * Example: cn("px-2 text-sm", isBig && "text-lg") -> "px-2 text-lg"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
