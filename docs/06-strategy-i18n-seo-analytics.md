# 06 — i18n, SEO & Analytics Strategy

## Internationalization (EN / FR)

- **Library:** `next-intl` with a `[locale]` route segment. `en` = default (no prefix optional or `/en`), `fr` = `/fr`.
- **Middleware** negotiates locale (cookie → `Accept-Language` → default) and rewrites.
- **UI strings:** `messages/en.json` + `messages/fr.json`, namespaced by feature.
- **CMS content** (products, services, blog, events, testimonials, categories, SEO meta): stored **per-locale** so translations are real content, not machine chrome. Admin editors edit each locale; missing FR falls back to EN with a visible "untranslated" flag.
- **Formatting:** dates, numbers, currency via `next-intl` formatters per locale.
- **Locale switcher** preserves the current path.

## SEO (technical — detailed in Phase 18)

- **Metadata:** Next.js Metadata API per route; localized `title`/`description`; canonical URLs; **`hreflang`** alternates for `en`/`fr`.
- **Structured data (JSON-LD):**
  - `LocalBusiness` / `Organization` (site-wide) — name, logo, geo/service area, hours, contact, social.
  - `Product` + `AggregateRating` + `Review` (shop & rent).
  - `Event` (events).
  - `Article` (blog posts).
  - `FAQPage` (FAQ).
  - `BreadcrumbList` (deep pages).
- **Sitemaps:** dynamic `sitemap.xml` (locale-aware) + `robots.txt`.
- **OG/Twitter:** dynamic OG images via `/api/og` per product/post/event.
- **Performance is SEO:** ISR + Cloudflare image optimization + lazy 3D → fast LCP; target Lighthouse SEO ≥ 95.
- **Semantic HTML & accessibility** feed SEO: proper headings, alt text (localized), descriptive links.
- **Clean URLs:** localized slugs; 301 strategy for any future changes.

## Analytics

- **Google Analytics 4** — page views, key events: `view_item`, `add_to_cart`, `begin_quote`, `submit_order_request`, `submit_booking_request`, `register_event`, `newsletter_signup`, `whatsapp_click`. Loaded via `next/script` (afterInteractive), consent-aware.
- **Microsoft Clarity** — heatmaps + session recordings to refine UX/conversion.
- **Consent:** lightweight cookie consent gating analytics scripts (GDPR/CCPA-friendly; relevant for FR/EU visitors).
- **Admin dashboard tiles** surface GA4 highlights + internal funnel (requests → confirmed → paid) from our own DB.

## Conversion principles (baked into design)
- One primary CTA per screen ("Get a Quote" / "Rent Now" / "Request Order").
- Trust signals high and often: rating + review count, insured/clean/on-time, partner logos.
- < 5s clarity on every landing; instant quote & availability reduce friction.
- WhatsApp + contact always one tap away.
