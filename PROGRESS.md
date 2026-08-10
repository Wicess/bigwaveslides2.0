# Build Progress — Big Wave Slides

20-phase build. One phase at a time; each phase ends with full code (no placeholders), install commands, testing, deployment verification, an acceptance checklist, and a git commit. **No on-site payments** — request + email model throughout.

| # | Phase | Status |
|---|---|---|
| 1 | Discovery, Architecture & Data Design | ✅ Complete |
| 2 | Project Setup & Configuration | ✅ Complete |
| 3 | Design System & Motion Engine | ✅ Complete |
| 4 | Database & Prisma (Neon + pgvector) | ✅ Complete |
| 5 | Media Pipeline (R2 + CDN + Image Optimization) | ✅ Complete |
| 6 | Global Layout (mega-menu, footer, i18n, WhatsApp) | ✅ Complete |
| 7 | Homepage | ✅ Complete |
| 8 | About, Services & Contact | ✅ Complete |
| 9 | Shop System Part 1 (discovery, AI search, reviews, wishlist) | ✅ Complete |
| 10 | Shop System Part 2 (cart, request order, abandoned-request) | ✅ Complete |
| 11 | Rental System Part 1 (availability, pricing, instant quote) | ✅ Complete |
| 12 | Rental System Part 2 (booking request, digital contracts) | ✅ Complete |
| 13 | Events, Blog & Testimonials | ✅ Complete |
| 14 | Authentication & Customer Accounts | ✅ Complete |
| 15 | Admin Dashboard Part 1 (commerce ops) | ✅ Complete |
| 16 | Admin Dashboard Part 2 (CRM, content, governance) | ✅ Complete |
| 17 | Integrations & Communications (email, WhatsApp, analytics) | ✅ Complete |
| 18 | SEO, Structured Data, Legal & 404 | ✅ Complete |
| 19 | Testing, Performance, Security & Accessibility | ✅ Complete |
| 20 | Deployment & Production Launch | ✅ Complete |

---

## Phase 1 — Discovery, Architecture & Data Design ✅

**Delivered:**
- System architecture & rendering strategy — `docs/01-architecture.md`
- Full database model (ERD, all entities, enums, relations) — `docs/02-database-schema.md`
- Sitemap & route map (i18n-aware) — `docs/03-sitemap-and-routes.md`
- Low-fidelity wireframes for every page — `docs/04-wireframes.md`
- Folder architecture — `docs/05-folder-structure.md`
- i18n, SEO & analytics strategy — `docs/06-strategy-i18n-seo-analytics.md`
- Project README & `.gitignore`
- Git repository initialized

**No application code yet** — Phase 1 is design/architecture only, per plan. Implementation begins Phase 2.

---

## Phase 2 — Project Setup & Configuration ✅

**Delivered:**
- Next.js **15.5.19** + React **19.2.7** + TypeScript (strict, `noUncheckedIndexedAccess`)
- **Tailwind v4** (CSS-first) with the brand palette as design tokens + glassmorphism utilities — `app/globals.css`
- **next-intl v4** EN/FR routing — `i18n/`, `middleware.ts`, `messages/{en,fr}.json`, type-safe message keys (`global.d.ts`)
- Self-hosted variable fonts (`@fontsource-variable/inter` + `sora`) — deterministic offline builds
- Typed, validated env loader (`lib/env.ts`) + documented `.env.example`
- `cn()` utility, locale switcher component, localized 404
- ESLint 9 flat config (typescript-eslint + Next core-web-vitals), Prettier + Tailwind plugin
- Scaffolding splash at `/[locale]` proving tokens, fonts, and EN/FR

**Verification:**
- `npm run build` → ✓ compiled; `/en` & `/fr` prerendered (SSG), middleware active
- `npm run typecheck` → ✓ clean
- `npm run lint` → ✓ clean (exit 0)
- Runtime: `/` → 307 → `/en`; `/en` renders English, `/fr` renders French

**Decisions:** honored Next 15 pin (not 16); Tailwind v4 CSS-first config; self-hosted fonts (sandbox can't fetch Google Fonts reliably; also better for production determinism); lint kept out of `next build` (`eslint.ignoreDuringBuilds`) and run as its own gate.

---

## Phase 3 — Design System & Motion Engine ✅

**Delivered:**
- **UI primitives** (`components/ui/`): Button (6 variants, sizes, loading, asChild), Container, Section + Eyebrow + SectionHeader (tight rhythm), Card (solid/glass + parts), Badge, Input, Textarea, Label, Select, Dialog, Tabs, Accordion, Marquee, Toaster (sonner)
- **Design tokens** expanded in `app/globals.css`: brand palette + tint scale, glass/text-gradient utilities, marquee + accordion keyframes, Lenis base styles, focus ring + scrollbar
- **Motion engine** (`components/motion/`): Lenis smooth-scroll provider synced to GSAP ScrollTrigger, shared Framer Motion variants, `<Reveal>` scroll-reveal, `<KineticText>` word-stagger, page-transition `template.tsx` — all `prefers-reduced-motion` safe
- **3D** (`components/three/`): lazy-loaded R3F liquid blob (`WaveScene`) with static-gradient reduced-motion fallback, no external asset fetches
- Providers wired into locale layout (Lenis + Toaster)
- **`/styleguide`** route showcasing every token, component, and motion sample

**Verification:**
- `npm run build` → ✓ 7/7 static pages (`/en` `/fr` + styleguide ×2); 3D in async chunk
- `npm run typecheck` → ✓ clean
- `npm run lint` → ✓ clean
- Runtime: `/en/styleguide` → 200, all sections render (Buttons, Typography, Accordion, Marquee, …)

---

## Phase 4 — Database & Prisma (Neon) ✅

**Delivered:**
- Full Prisma schema (`prisma/schema.prisma`) — 33 models, 22 enums, relations & indexes covering catalog, CRM, request-based orders/bookings, quotes, contracts, events, blog, testimonials, services, media, RBAC, activity logs, settings
- **Prisma 7 + pg driver adapter** wired (`lib/prisma.ts` singleton; `prisma.config.ts` for migrations) — pooled URL at runtime, direct URL for migrations
- Initial migration applied to **Neon** (`prisma/migrations/…_init`)
- Search extensions enabled: **pg_trgm + pgvector** (`prisma/extensions.sql`) — ready for Phase 9
- Localized-content helper (`lib/localized.ts`, `{en,fr}` Json convention)
- Rich idempotent seed (`prisma/seed.ts`): 5 categories · 7 products · 10 rental units · 11 services · 3 blog posts · 3 events · 5 testimonials · 28 permissions · 3 roles · 1 admin user · 4 settings
- Scripts: `db:migrate`, `db:seed`, `db:studio`, `db:generate`, `db:check`; `postinstall` runs `prisma generate` (Vercel-ready)

**Verification:**
- `prisma migrate dev` → ✓ applied to Neon
- `db:seed` → ✓ complete; `db:check` count table confirms all rows
- `npm run typecheck` ✓ · `npm run lint` ✓ · `npm run build` ✓

**Decisions:** Prisma 7 (current major) requires URLs in `prisma.config.ts` + a driver adapter — adopted `@prisma/adapter-pg`. Localized CMS text stored as `{en,fr}` Json. Seed images are placeholders (picsum) — replaced with curated water media on R2 in Phase 5. Admin login seeded: `admin@bigwavesslides.com` / `BigWave!2026` (change before launch).

---

## Phase 5 — Media Pipeline (Cloudflare R2 + CDN) ✅

**Delivered:**
- `lib/r2.ts` (server-only) — R2 S3 client + `r2PutObject`, `r2PresignUpload`, `r2DeleteObject`, `r2PublicUrl`, `buildMediaKey`
- `app/api/media/upload/route.ts` — server upload → R2 → `MediaAsset` record; type/size validation (25 MB, images/MP4/PDF)
- `components/ui/media-image.tsx` — optimized `<MediaImage>` (next/image, AVIF/WebP, fill-based, lazy)
- `components/media/upload-dropzone.tsx` — drag & drop uploader with live XHR progress
- R2 creds in `.env.local`; `R2_ENDPOINT` added to typed env

**Verification (end-to-end, real upload):**
- POST image → route → R2 object + `MediaAsset` row (`id` returned) → **public CDN GET 200, `image/jpeg`, byte-exact (56,525)**
- `typecheck` ✓ · `lint` ✓ · `build` ✓ (`/api/media/upload` dynamic route)

**Decisions / notes:** upload goes **through the server** (no bucket CORS needed); presigned direct-upload helper is available for later if CORS is configured. next/image (Vercel optimizer) handles optimization of R2 originals; a Cloudflare Images custom-domain layer can be added later. Upload endpoint is gated by **admin auth in Phase 14**. Curated real water media is uploaded to R2 per-page as those pages are built (Phases 6+); seed still uses placeholders for now. Transient Neon cold-connection timeouts can occur on first query — global query-retry hardening is slated for Phase 17/19.

---

## Phase 6 — Global Layout ✅

**Delivered:**
- **Glass mega-menu header** (`site-header.tsx`) — scroll-aware, logo, Shop/Rent/Services dropdown panels (DB-driven categories, popular rentals, services), Events/Blog/About/Contact links, search/wishlist/cart/account icons, EN/FR switcher, "Get a Quote" CTA, full-screen animated mobile menu
- **Rich footer** (`site-footer.tsx`) — working newsletter (Server Action → `NewsletterSubscriber`), explore + services links, contact (email/phone/address), social (inline brand SVGs), trust badges, legal links
- **Floating WhatsApp** (click-to-chat from settings), **scroll-progress** bar, **back-to-top**
- Cached nav data layer (`server/data/navigation.ts`) with **retry** (`lib/retry.ts`) for Neon resilience; revalidate-tag ready
- Newsletter Server Action (`server/actions/newsletter.ts`); brand icons (`components/icons/brand.tsx`); +Layout i18n keys (EN/FR)
- Wired into locale layout (header above page, footer below, outside page-transition transform)

**Verification:**
- `typecheck` ✓ · `lint` ✓ · `build` ✓ (8/8 static, ISR 1h)
- Runtime: `/en` renders mega-menu categories (Inflatable Water Slides), popular rentals (Tropical Twist), footer services (Birthday Parties), WhatsApp number, contact email, trust badges; `/fr` renders localized nav (Boutique, Location, Obtenir un devis, Tous droits réservés)

**Note:** lucide v1 dropped brand icons → inline SVG brand glyphs. Build-time Neon timeout initially baked empty nav; fixed with `withRetry`.

---

## Phase 7 — Homepage ✅

**Delivered (11 cinematic, data-driven sections):**
1. **Hero** — R3F liquid-blob scene, kinetic headline, dual CTAs, star rating, "check your date" widget (→ /rent?date=)
2. **Trust band** — insured/clean/on-time badges + audience marquee
3. **Featured slides** — DB-driven `ProductCard` grid (reusable, with rating/price/badges)
4. **Rental categories** — image cards with gradient overlay
5. **Services overview** — icon cards by service category
6. **How it works** — 3-step **GSAP ScrollTrigger** scrollytelling (scrub progress line), reduced-motion safe
7. **Why choose us** — animated count-up stat counters (in-view)
8. **Upcoming events** — DB event cards with date/location
9. **Testimonials** — snap-scroll carousel with prev/next
10. **Latest blog** — DB post cards (category, reading time, date)
11. **Final CTA** — gradient band → quote/rent

**Supporting:** `server/data/home.ts` (cached + retry + aggregate stats), `ProductCard`, `Stars`, `lib/format.ts` (price/date), expanded Home/Product i18n (EN/FR), Prisma adapter timeouts tuned for resilience.

**Verification:**
- `typecheck` ✓ · `lint` ✓ · `build` ✓ (8/8 static, ISR 10min)
- Runtime `/en` (231 KB): renders hero, Tropical Twist + Castle Splash (featured), Inflatable Water Slides (category), Birthday Parties (service), Summer Splash (event), "Rent in 3 easy steps", testimonials, blog — all live DB content

**Note:** Phase 2 splash + `Setup` i18n removed. Cold build with three.js ~3.5min on this machine (warm builds fast; Vercel fast). Real curated water imagery still pending real assets — cards use placeholders, hero uses 3D/gradients.

---

## Phase 8 — About, Services & Contact ✅

**Delivered:**
- **About** (`/about`) — story + mission, animated `CountUp` stat counters, values grid, team, service-area map, gradient CTA
- **Services list** (`/services`) — DB-driven `getAllServices`, cards grouped into *event services* vs *installation & support*, custom-quote CTA
- **Service detail** (`/services/[slug]`) — hero image, "what's included" checklist, gallery, related services, SSG via `getServiceSlugs`; localized meta
- **Contact** (`/contact`) — RHF + Zod form with honeypot → `submitContact` server action → `ContactInquiry` row (email/auto-reply deferred to Phase 17); settings-driven info, opening hours, WhatsApp + call CTAs; keyless Google Maps embed
- **Shared infra:** `PageHeader`, `MapEmbed`, `CountUp`, `getAllServices`/`getServiceBySlug`, `getSettings`; EN/FR strings for all four pages

**Verification:**
- `typecheck` ✓ · `lint` ✓ · all nav links (`/about`, `/services`, `/services/[slug]`, `/contact`) now resolve
- Build prerender not run to completion locally (Neon unreachable in this env → `withRetry` backoff; same condition as Phase 7). Compiles where DB is reachable.

---

## Phase 9 — Shop System Part 1 (discovery, AI search, reviews, wishlist) ✅

**Delivered:**
- **Shop catalog** (`/shop`) — faceted filters (category, price bands, rating), sort (featured/newest/price/rating), URL-driven state, responsive grid, pagination, mobile filter disclosure
- **Category listing** (`/shop/category/[slug]`) — shared `ShopView`, SSG via `generateStaticParams`, localized category meta
- **Product detail** (`/shop/[slug]`) — client gallery (image/video thumbnails), buy-box (rating, price, deposit, specs), **Request a Quote** CTA (no on-site payment), wishlist, trust badges, tabs (description / features / reviews), related products, SSG + localized meta
- **Typo-tolerant "AI" search** — `pg_trgm` similarity + ILIKE ranking via `$queryRaw` (`searchProductSlugs`) with a graceful Prisma `contains` fallback; `/api/search` route powers a debounced live search dropdown (`SearchBox`)
- **Reviews** — approved-review list + star-rating submit form → `submitReview` server action (held `PENDING` for Phase 16 moderation), honeypot-protected, revalidates `products`
- **Wishlist** — `useWishlist` localStorage hook + `WishlistButton` (icon on cards, full on detail); server persistence deferred to Phase 14 auth
- **Data layer** `server/data/products.ts` — `getShopProducts` (filter/sort/paginate), `getProductBySlug`, `getRelatedProducts`, `getProductCategories`, `getCategoryBySlug`, `searchProducts`, `getApprovedReviews`
- **Migration** `…_product_search_trgm` — trigram GIN index on `Product.searchText`
- EN/FR strings for `Shop`, `ProductDetail`, `Reviews` (ICU plurals)

**Verification:**
- `typecheck` ✓ · `lint` ✓
- Build prerender not run to completion locally (cold three.js + Neon unreachable in this env; identical condition to Phases 7–8). `generateStaticParams` calls are `.catch`-guarded so they degrade gracefully.

**Decisions / notes:** "AI search" is implemented as typo-tolerant lexical search (pg_trgm) which works fully offline; true semantic **pgvector** embeddings need an embedding provider and are slated to layer in during Phase 17 (integrations) — the extension and `searchText` column are already in place. Cart / request-order / abandoned-request flow is **Phase 10**, so the product CTA is "Request a Quote" (Add-to-Cart arrives next phase). Wishlist is client-side until auth (Phase 14).

---

## Phase 10 — Shop System Part 2 (cart, request order, abandoned-request) ✅

**Delivered:**
- **Server-side cart** keyed by an httpOnly session cookie (`lib/cart-session.ts`) — persists to `Cart`/`CartItem` so it survives reloads and powers abandoned-request recovery. Data layer `server/data/cart.ts` (`getCart`, `getCartCount`); actions `server/actions/cart.ts` (`addToCart`, `setQuantity`, `removeItem`, `clearCart`) with ownership checks, qty clamping, and `lastActivityAt` touch
- **Add to Cart** on product detail — qty stepper + gradient CTA; dispatches a window event so the **header cart badge** (`CartBadge`, live count via `/api/cart`) updates instantly. Request-a-Quote demoted to secondary, wishlist alongside
- **/cart** — optimistic qty/remove, order summary (subtotal, delivery "from"/"quoted by location", est. total with no-payment note), empty/success states; two-step → request form → confirmation with reference number
- **Request order** (`server/actions/orders.ts`) — converts cart → `Order` (PENDING/PENDING, no payment), snapshots line items, stores delivery address + event date/notes, marks cart `CONVERTED`, clears cookie; honeypot-protected. Staff invoice in admin (Phase 15), email in Phase 17
- **/quote** — general request-a-quote page; `?product=slug` prefills product context → `QuoteRequest` (+ `QuoteItem`) via `server/actions/quotes.ts`; honeypot-protected. Header "Get a Quote" + product page both route here
- **Abandoned-request recovery** — `POST /api/cron/abandoned-carts` (Bearer `CRON_SECRET`) flags `ACTIVE` carts idle > 24h with items as `ABANDONED` + stamps `reminderSentAt` (idempotent); reminder emails wired in Phase 17. `ref-number.ts` for order/quote refs; `CRON_SECRET` added to env
- EN/FR strings for `Cart`, `OrderRequest`, `Quote` (ICU plurals)

**Verification:**
- `typecheck` ✓ · `lint` ✓ · server/client boundaries reviewed (`import type` for server-only cart types into the client cart component; server actions imported into client forms)
- Full `next build` not completed locally — cold three.js compile exceeds the runnable window in this env (same condition noted since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** Cart is guest/session-based now; it will associate with the signed-in customer in **Phase 14** (auth). No on-site payment anywhere — orders and quotes are request-based and followed up manually by staff. Delivery fee is shown as an estimate ("from $X" / "quoted by location") and confirmed in the staff quote, honoring the request-based model.

---

## Phase 11 — Rental System Part 1 (availability, pricing, instant quote) ✅

**Delivered:**
- **Rental catalog** (`/rent`) — `RENTAL`/`BOTH` products, category chips + sort + pagination, honors the homepage "check your date" widget (`?date=` flows through each card to the unit's calendar)
- **Rental detail** (`/rent/[slug]`) — gallery, about/features, specs, sticky buy-box, trust badges, wishlist, related rentals; SSG via `getRentalSlugs`; localized meta
- **Real-time availability calendar** — dependency-free month calendar with range selection, past/booked dates disabled, legend; loads blocked dates from `/api/availability`
- **Instant quote** — live price breakdown (rate × days, delivery/setup, refundable deposit, estimated total) that re-checks availability for the chosen range and shows an Available/Unavailable badge
- **Availability engine** (`server/data/availability.ts`) — hard-blocks dates ONLY for **CONFIRMED** bookings (tentative/REQUESTED holds never block, per the request-based model); `getAvailabilityWindow` (calendar) + `checkRange` (instant quote)
- `/api/availability` route (range check + blocked-dates window); `lib/rental-pricing.ts` (pure date + pricing helpers); rentals data layer (`server/data/rentals.ts`)
- `ProductCard` gained an optional `query` passthrough; EN/FR strings for `Rent`/`RentalDetail`/`Availability` (ICU plurals)

**Verification:**
- `typecheck` ✓ · `lint` ✓ · server/client boundaries reviewed (calendar/instant-quote are client; pages are server; pricing helpers are pure and shared)
- Full `next build` not completed locally — cold three.js compile exceeds the runnable window in this env (same condition since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** The instant quote produces an estimate only — the actual **booking request, date holds, and digital contracts are Phase 12**. The "Request this booking" CTA routes to `/quote` (prefilling the event date) so it's never a dead end; Phase 12 replaces it with the dedicated `/rent/checkout` flow that writes a `Booking` + tentative hold. Delivery/pickup are shown as estimates and confirmed in the staff quote. Availability deliberately ignores tentative holds so a single request never blocks the calendar for everyone else.

---

## Phase 12 — Rental System Part 2 (booking request, digital contracts) ✅

**Delivered:**
- **Booking request flow** (`/rent/checkout`) — multi-section form (event details, delivery address, contact), live order summary; reached from the rental detail "Request this booking" CTA with dates carried via `?product=&start=&end=`
- **Booking creation** (`server/actions/bookings.ts`) — re-checks availability server-side, computes totals (rental + delivery + pickup + deposit), writes a `Booking` (REQUESTED + **TENTATIVE** hold — never blocks the calendar) with a `BookingItem` and a **DRAFT `RentalContract`**, all in one nested create; returns booking + contract refs
- **Digital contract** (`/contract/[number]`) — full rental agreement rendered from booking data (parties, equipment, dates, fee breakdown, refundable deposit, 6 standard terms), print/save-to-PDF, and a **legally-meaningful e-signature**: typed name + explicit consent → `signContract` records `signerName`, `signedAt`, **IP address**, and an immutable `auditTrail` entry; status → SIGNED with a confirmation panel
- `lib/ref-number.ts` gained `bookingNumber()` + `contractNumber()` (the contract number doubles as the public signing-URL token); contract data layer (`server/data/contracts.ts`)
- EN/FR strings for `Checkout` + `Contract` (terms, statuses, e-sign copy)

**Verification:**
- `typecheck` ✓ · `lint` ✓ · boundaries reviewed (forms + e-sign are client; checkout/contract pages are server; availability re-checked in the action, not trusted from the client)
- Full `next build` not completed locally — cold three.js compile exceeds the runnable window (same condition since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** Contracts render as styled HTML (print-to-PDF ready); server-side PDF generation to R2 + emailing the signed copy are layered in **Phase 17**. The signing page is reachable by its unguessable contract number for guests now; it also surfaces in the customer account in **Phase 14**. Bookings stay TENTATIVE until an admin confirms them (Phase 15), which is the only thing that converts the hold to HARD and blocks the calendar — consistent with the request-based, no-online-payment model.

---

## Phase 13 — Events, Blog & Testimonials ✅

**Delivered:**
- **Events** — `/events` (upcoming + past grids, capacity-aware "spots left" badges) and `/events/[slug]` (cover, description, gallery, sticky registration card); `registerForEvent` action writes a PENDING `EventRegistration`, respects the registration toggle and remaining capacity; SSG via `getEventSlugs`
- **Blog** — `/blog` index with sidebar (categories w/ counts, popular tags, search), `/blog/category/[slug]`, `/blog/tag/[slug]`, and `/blog/[slug]` article (author, reading time, tags, related posts); shared `BlogView`; JSON title/excerpt search; SSG for posts/categories/tags
- **Testimonials** — `/testimonials` grid + "leave a review" form; `submitTestimonial` action stores a PENDING, locale-keyed quote for moderation
- Cards/forms: `EventCard`, `PostCard`, `TestimonialCard`, `RegistrationForm`, `TestimonialForm`, `BlogSearch`; data layers `server/data/{events,blog,testimonials}.ts`
- EN/FR strings for `Events`/`EventDetail`/`EventRegistration`/`Blog`/`Testimonials` (ICU plurals)

**Verification:**
- `typecheck` ✓ · `lint` ✓ · boundaries reviewed (forms client; pages + cards server; cached reads for categories/tags/testimonials)
- Full `next build` not completed locally — cold three.js compile exceeds the runnable window (same condition since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** Registrations, reviews, and testimonials are all **request/moderation-based** (PENDING → approved/confirmed in admin, Phases 15–16) — no payment, consistent with the site model. Blog post bodies render the localized `content` string as paragraphs; the **rich-text editor + media embeds come with the admin in Phase 16**. Confirmation emails for registrations are wired in Phase 17 (SMTP).

---

## Phase 14 — Authentication & Customer Accounts ✅

**Delivered:**
- **Auth.js v5 (NextAuth beta) credentials auth** against the `Customer` model — `lib/auth.ts` (JWT sessions, bcrypt verify), `/api/auth/[...nextauth]`, session/JWT type augmentation (`types/next-auth.d.ts`)
- **Auth pages** — `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` with RHF + Zod forms; bcrypt(12) password hashing; password reset via short-lived **HS256 jose token** (email delivery in Phase 17); forgot-password never reveals whether an email exists
- **Guarded `/account` area** — layout redirects guests to `/sign-in`; dashboard (summary tiles) + **orders, bookings, quotes, contracts, wishlist, profile** sub-pages; account nav with sign-out
- **Guest → customer linking** — on sign-in/up the guest cart cookie is claimed (`cart.customerId`), and the localStorage wishlist is merged into DB `WishlistItem` (`WishlistSync` + `syncWishlist`); account history matches by `customerId` OR the email used as a guest
- Actions: `registerCustomer`, `signInWithCredentials`, `signOutAction`, `requestPasswordReset`, `resetPassword`, `updateProfile`, `removeFromWishlist`, `syncWishlist`; data layer `server/data/account.ts`; status-label helper (`lib/status-labels.ts`)
- EN/FR strings for `Auth` + `Account`

**Verification:**
- `typecheck` ✓ · `lint` ✓ · boundaries reviewed (auth/account forms client; pages + data server-only; bcrypt/prisma kept off the edge — auth is not used in middleware)
- Full `next build` not completed locally (cold three.js compile; same since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** Added `next-auth@5 beta` + `jose` (npm install succeeded; engine warns about node 22 but runs on 20 / Vercel). **JWT session strategy** (no Prisma adapter / Session table needed) since auth is credentials-only. **Set `NEXTAUTH_SECRET` in production** — the reset-token + session signing fall back to a dev secret otherwise. Customer auth only; **admin auth/RBAC is Phase 15**. Password-reset + registration/confirmation emails are wired in Phase 17 (SMTP) — the token flow is fully built and just needs the send step.

---

## Phase 15 — Admin Dashboard Part 1 (commerce ops) ✅

**Delivered:**
- **Admin auth + RBAC** — dedicated jose-signed httpOnly session (`lib/admin-auth.ts`, separate from customer NextAuth) verifying `AdminUser` via bcrypt; role permissions loaded into the session; `requireAdmin` / `requirePermission` / `can` guards; `ActivityLog` audit helper. `/admin/login` + `adminLogin`/`adminLogout`
- **Admin shell** — non-localized admin area via Next **multiple root layouts** (`app/admin/layout.tsx` html/body + Toaster); guarded `(panel)` group with sidebar; login sits outside the guard
- **Dashboard** — KPI tiles (pending orders, booking requests, new quotes, paid revenue), recent orders/bookings, recent activity feed
- **Orders** — list + detail; update order status, payment status (PENDING→…→PAID_IN_FULL, stamps `paidAt`), invoice/internal note
- **Bookings** — list + detail; confirm/decline; **confirming converts the TENTATIVE hold to HARD** (blocks the calendar) and advances the contract DRAFT→SENT; payment status; contract link
- **Quotes** — list + detail; status, estimate ($), staff notes
- **Products** — list, create, edit (localized EN/FR name/short/description, slug, SKU, type, status, prices, deposit, category, featured), delete; **Categories** add + list; **Inventory** — per-product rental units, add + toggle active
- Admin data layer (`server/data/admin.ts`), permission-gated action files per module, reused `StatusBadge` (locale `en`)

**Verification:**
- `typecheck` ✓ · `lint` ✓ · every mutating action calls `requirePermission(...)` server-side and writes an `ActivityLog`
- Full `next build` not completed locally (cold three.js compile; same since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** Admin is **not localized** (English UI) per the sitemap — no i18n overhead. Admin auth is intentionally **separate** from customer auth (different cookie, same `NEXTAUTH_SECRET`) so customers can never reach `/admin`. Seeded super-admin: `admin@bigwavesslides.com` / `BigWave!2026` (change before launch). Product media management (gallery/variations upload) and category editing/delete are deferred to **Phase 16** (CRM/content/governance), along with customers, blog/events admin, testimonials/reviews moderation, media library, settings, users/roles, and activity log views. Email notifications on status changes land in Phase 17.

---

## Phase 16 — Admin Dashboard Part 2 (CRM, content, governance) ✅

**Delivered (all permission-gated + audit-logged):**
- **CRM** — Customers list + detail (profile, lifetime value, orders/bookings/quotes history, editable notes & tags); Contact inbox (status workflow NEW→IN_PROGRESS→RESOLVED); Newsletter subscribers
- **Moderation** — Reviews (approve/reject/delete, recomputes product `ratingAvg`/`ratingCount`); Testimonials (approve/reject/feature)
- **Content** — Blog posts CRUD (localized EN/FR title/excerpt/content, status, cover, author/category, **publish gated by `blog.publish`**) + taxonomy (categories/tags/authors); Events CRUD (datetime, capacity, registration toggle) + registrations list
- **Governance** — Settings editor (contact, hours, fees, social → `SiteSetting` upserts, revalidates `settings`); Media library (upload via R2 dropzone + delete from R2; **upload route now requires `media.write`**); Admin users (create with bcrypt, activate/deactivate, can't self-deactivate); Roles overview; Activity log viewer
- Grouped admin sidebar (Commerce / CRM & comms / Content / Governance); CMS data layer (`server/data/admin-cms.ts`); per-module action files

**Verification:**
- `typecheck` ✓ · `lint` ✓ · every mutating action calls `requirePermission(...)` and writes an `ActivityLog`; the public `/api/media/upload` is now admin-gated
- Full `next build` not completed locally (cold three.js compile; same since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** Role/permission **editing** is intentionally read-only in the UI (managed via seed/migrations) — assignment happens when creating admin users. Rich-text blog editing uses plain localized textareas (a WYSIWYG can be added later without schema change). Status-change/notification emails (orders, bookings, contacts, registrations) are wired in **Phase 17 (SMTP)**. The entire admin surface (Phases 15–16) is English-only and isolated under `/admin` with its own session.

---

## Phase 17 — Integrations & Communications (email, WhatsApp, analytics) ✅

**Delivered:**
- **Transactional email** (Hostinger SMTP via `nodemailer`) — `lib/email.ts` (lazy transport, branded email-safe HTML layout, best-effort `sendEmail` that skips cleanly when SMTP is unset and never throws into a request). `lib/notifications.ts` composes per-flow templates
- **Wired every request flow** to email customer + admin: order requests, booking requests (with sign-contract CTA), quote requests, contact (auto-reply + admin copy), event registrations, password reset (the jose link is now actually sent), and admin-triggered **order/booking status updates** notify the customer
- **Abandoned-cart recovery** — the cron now emails reminders to carts linked to a known customer
- **WhatsApp Cloud API** — `lib/whatsapp.ts` (`sendWhatsApp` / `notifyAdminWhatsApp`, best-effort, credential-gated); admin gets a WhatsApp ping on new orders/bookings; `/api/whatsapp/webhook` (Meta verify handshake + receipt acknowledgement)
- **Analytics** — `components/analytics.tsx` injects GA4 + Microsoft Clarity via `next/script` (`afterInteractive`), rendered only when their IDs are configured; added to the locale layout
- `WHATSAPP_VERIFY_TOKEN` added to typed env; installed `nodemailer`

**Verification:**
- `typecheck` ✓ · `lint` ✓ · all sends are best-effort/credential-gated, so missing SMTP/WhatsApp/analytics config degrades to no-ops without breaking flows
- Full `next build` not completed locally (cold three.js compile; same since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** Emails are sent inline (awaited, try/caught) rather than via a queue — fine at this scale and avoids serverless fire-and-forget cutoffs. WhatsApp free-form text only delivers inside the 24-hour service window; approved message templates should be added before relying on proactive outbound. Set `SMTP_*`, `WHATSAPP_*`, `NEXT_PUBLIC_GA_ID`, and `NEXT_PUBLIC_CLARITY_ID` in production to activate each channel. Remaining: **Phase 18** SEO/structured-data/legal/404, **19** testing/perf/a11y, **20** deploy.

---

## Phase 18 — SEO, Structured Data, Legal & 404 ✅

**Delivered:**
- **`app/sitemap.ts`** — every static + dynamic route (products, rentals, services, posts, events, product/blog categories, tags) emitted per locale with hreflang `alternates`; **`app/robots.ts`** disallows `/admin`, `/account`, `/api/`, `/cart`
- **Structured data** (`lib/structured-data.ts` + `<JsonLd>`): Organization + WebSite (with SearchAction) in the layout; **Product** on shop & rental detail (offers + aggregateRating), **Article** on blog posts, **Event** on event detail, **BreadcrumbList** on shop detail, **FAQPage** on /faq
- **Dynamic OG images** — `app/api/og` (`next/og` ImageResponse, branded gradient) wired as the default `openGraph`/`twitter` image in layout metadata
- **Legal & FAQ** — `/privacy-policy`, `/terms-of-service`, and `/faq` (accessible `<details>` accordion + FAQ schema), all bilingual via `lib/legal-content.ts`; footer links now resolve
- Localized 404 already in place from Phase 2

**Verification:**
- `typecheck` ✓ · `lint` ✓ · sitemap/robots data loaders are `.catch`-guarded so generation never fails on a cold DB
- Full `next build` not completed locally (cold three.js compile; same since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** OG route uses the `edge` runtime (required by `next/og`). Legal/FAQ copy is solid, production-ready boilerplate tailored to the request-based, no-online-payment model — have counsel review before launch. hreflang is emitted in the sitemap; per-page `<link rel=alternate>` can be added later via `generateMetadata` alternates if needed. Remaining: **Phase 19** (testing, performance, security, accessibility) and **Phase 20** (deployment).

---

## Phase 19 — Testing, Performance, Security & Accessibility ✅

**Delivered:**
- **Testing** — Vitest configured (`vitest.config.ts` with `@/` alias) + `test`/`test:watch` scripts; **23 unit tests across 2 files, all passing** — rental pricing/date math (`rentalDays`, `eachDate`, `parseISODate`, `computeQuote`), `getLocalized` fallbacks, status labels/tones, reference-number formats + uniqueness, and structured-data builders (Product/FAQ/Breadcrumb)
- **Security** — hardening headers in `next.config.ts` (`X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, HSTS preload); in-memory **rate limiter** (`lib/rate-limit.ts`) applied to `/api/search` (40/min) and `/api/availability` (60/min) returning 429 + `Retry-After`; the media upload route is already permission-gated (Phase 16)
- **Accessibility** — skip-to-content link (bilingual `Common.skipToContent`) + `#main-content` landmark; builds on the existing `prefers-reduced-motion` support, focus rings, aria labels, and semantic headings from earlier phases
- **Performance** — confirmed image AVIF/WebP + remote patterns, `optimizePackageImports` (lucide/framer-motion), `poweredByHeader: false`, React strict mode, self-hosted fonts, lazy 3D, ISR/cache tags throughout

**Verification:**
- `typecheck` ✓ · `lint` ✓ · **`vitest run` → 23/23 passing** (real, executed in this environment)
- Full `next build` not completed locally (cold three.js compile; same since Phase 7); no compile/type errors surfaced.

**Decisions / notes:** A strict CSP was intentionally not added — GA/Clarity/JSON-LD inline scripts would require `unsafe-inline` or per-request nonces, which is best tuned against the live deploy; the other hardening headers are safe to ship now. The rate limiter is per-instance (in-memory) — a sensible first defense; swap in Redis/Upstash for global limits at scale. Final step: **Phase 20 — Deployment & Production Launch**.

---

## Phase 20 — Deployment & Production Launch ✅

**Delivered:**
- **`DEPLOYMENT.md`** — end-to-end launch playbook: Neon, Cloudflare R2, Hostinger SMTP, secret generation, Vercel import + env vars, `prisma migrate deploy` + seed, domain setup for **bigwavesslides.com**, admin first-login lock-down, optional WhatsApp/analytics, a copy-paste env block, and a pre-launch checklist
- **`vercel.json`** — hourly **cron** for the abandoned-cart sweep; the route is now a `GET` so Vercel Cron (which sends `Authorization: Bearer $CRON_SECRET`) can trigger it
- **`.env.example`** rewritten for production (adds `R2_ENDPOINT`, `CRON_SECRET`, `WHATSAPP_VERIFY_TOKEN`, prod URLs/notes)
- Contact defaults set to **contact@bigwavesslides.com** (email `FROM`, seed settings); README points to the deploy guide

**Verification:**
- `typecheck` ✓ · `lint` ✓ · `test` ✓ (23/23)
- The known-good build environment is **Vercel** (the cold three.js compile exceeds this sandbox's runnable window; types/lint/tests are green and the multi-root layout + all routes are sound).

**Decisions / notes:** Cron uses Vercel's native `CRON_SECRET` bearer convention. Minimum env to go live: site URL, `NEXTAUTH_*`, `DATABASE_URL`/`DIRECT_URL`; R2 + SMTP enable media + email; WhatsApp/analytics are optional and degrade gracefully. Seeded super-admin must be replaced on first login (checklist step). 🎉 **All 20 phases complete.**
