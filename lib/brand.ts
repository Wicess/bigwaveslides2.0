// lib/brand.ts
// The single source of truth for who this business IS.
//
// WHY THIS FILE EXISTS
// This site launched sharing a name, a product catalog, a price list and ~97%
// of its copy with bigwaveslides.com — a different company built from the same
// codebase. Google read the two as one site and filtered this one out of the
// index entirely, which is why nothing ranked for months. Nothing technical
// fixes that: two businesses called "Big Wave Slides" cannot both hold an
// entity in a search index. The name had to change.
//
// So: every brand string now resolves from here. Changing the company name,
// tagline or contact details is one edit, not a hunt through 149 hardcoded
// literals. Anything that identifies the business to a human or a crawler —
// Organization schema, email templates, legal documents, the PWA manifest, OG
// cards — must read from this file rather than inline a string.
//
// Plain module, no server-only: client components render the name too.

/** Legal + display name. Deliberately shares no word with the other site. */
export const BRAND_NAME = "Splash Republic";

/** Short form for tight spaces (nav badge, favicon text, PDF corners). */
export const BRAND_SHORT = "Splash Republic";

/** Initials mark used by the logo and the admin sidebar. */
export const BRAND_INITIALS = "SR";

/** One line under the name. Not a slogan — says what the business does. */
export const BRAND_TAGLINE = "Water slides, delivered.";

/**
 * Sentence used wherever the business introduces itself (About, schema
 * description, email footers, directory listings).
 *
 * Kept in one place because a consistent description across the site, the
 * schema and off-site profiles is what lets Google build a single confident
 * entity — the thing this business previously could not have, because the
 * description it used belonged to someone else.
 */
export const BRAND_DESCRIPTION =
  "Splash Republic rents and sells commercial-grade inflatable water slides, bounce houses and combo units across the United States — delivered, set up, sanitized and fully insured.";

/**
 * Contact details.
 *
 * NOTE: the email still sits on the current domain because that is the domain
 * the business controls today. Once a matching domain is registered, change it
 * here and nowhere else. A brand name that does not match its own email address
 * weakens the entity signal, so this is worth doing early.
 */
export const BRAND_EMAIL = "contact@bigwavesslides.com";
export const BRAND_PHONE = "+1 (614) 302-5899";

/** Brand marks. See public/brand/ — the wordmark is a plain SVG, no webfont. */
export const BRAND_LOGO = "/brand/splash-republic-logo.svg";
export const BRAND_MARK = "/brand/splash-republic-mark.svg";
/** Light-on-dark variant, for the hero and anything over imagery. */
export const BRAND_WORDMARK_LIGHT = "/brand/splash-republic-wordmark-light.svg";

/**
 * Absolute logo URL for contexts that cannot resolve a site-relative path:
 * transactional email, the PDF renderer, and the Satori-backed invoice image.
 *
 * Deliberately the PNG, not the SVG. Outlook and several older mobile clients
 * will not render an SVG in an <img>, and a broken logo at the top of an
 * invoice is worse than no logo at all. public/logo-email.png is rasterised
 * from the same source wordmark, so the two cannot drift.
 */
export const BRAND_LOGO_RASTER = "/logo-email.png";

export function brandLogoUrl(siteOrigin: string): string {
  return `${siteOrigin}${BRAND_LOGO_RASTER}`;
}

/**
 * Palette, mirroring the existing design tokens.
 *
 * The visual design is deliberately unchanged — only the identity moved. These
 * exist so the logo and generated OG cards stay in step with the site rather
 * than drifting into their own blues.
 */
export const BRAND_COLORS = {
  deep: "#003366",
  primary: "#0099FF",
  foam: "#7FD4FF",
  ink: "#0F172A",
} as const;
