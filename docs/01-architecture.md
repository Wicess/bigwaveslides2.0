# 01 — System Architecture & Decisions

> Phase 1 deliverable. This is the blueprint every later phase implements against.

## 1. High-level overview

A single Next.js 15 (App Router) application deployed on Vercel, serving three surfaces from one codebase:

1. **Public marketing + commerce site** (`/[locale]/...`) — Home, About, Services, Shop, Rent, Events, Blog, Testimonials, Contact, FAQ, legal.
2. **Customer account area** (`/[locale]/account/...`) — orders, bookings, contracts, wishlist, quote requests.
3. **Admin dashboard** (`/admin/...`) — enterprise CMS + CRM + operations.

```
                         ┌──────────────────────────────────────┐
        Visitor  ─────▶  │  Vercel Edge / Node (Next.js 15)      │
                         │  - RSC + Server Actions               │
                         │  - next-intl (en-US only)             │
                         │  - NextAuth (RBAC)                     │
                         └───────┬───────────────┬───────────────┘
                                 │               │
                   Prisma ───────▼──┐         ┌──▼───────── Nodemailer (SMTP)
                                    │         │              Hostinger Email
                 ┌──────────────────▼───┐     │
                 │ Neon PostgreSQL       │     ├──────────── Cloudflare R2 (S3 API)
                 │  + pgvector (AI search)│    │              + CDN + Image Resizing
                 │  + pg_trgm (fuzzy)    │     │
                 └───────────────────────┘     ├──────────── WhatsApp Cloud API
                                               │              (outbound notifications)
                                               └──────────── GA4 + Microsoft Clarity
```

**No payment processor.** Orders/bookings/quotes are persisted and emailed; staff send payment details manually and update status in admin.

## 2. Rendering strategy (per route)

| Route group | Strategy | Reason |
|---|---|---|
| Home, About, Services, FAQ, Privacy, Terms | **SSG + ISR** (`revalidate`, tag-based) | Mostly static; revalidate on admin edits |
| Shop catalog & product detail | **ISR** + on-demand `revalidateTag('products')` | Fast, SEO-indexable, fresh after admin changes |
| Blog index & posts | **ISR** + `revalidateTag('blog')` | Same |
| Events list & detail | **ISR** + `revalidateTag('events')` | Same |
| Rent catalog | **ISR** for listings; **dynamic** for availability checks | Listings cache; availability is real-time |
| Cart, request flows, account, admin | **Dynamic (SSR, no cache)** | Per-user/session, must be fresh |
| Availability API / search API | **Dynamic** | Real-time, query-driven |

**Mutations** use **Server Actions** (typed, validated with Zod) — no hand-rolled REST layer except where a public API endpoint is genuinely needed (webhooks for WhatsApp delivery receipts, sitemap, OG image generation, R2 presign).

## 3. Caching & revalidation

- Read queries wrapped in `unstable_cache` / fetch cache keyed by **cache tags** (`products`, `product:<id>`, `blog`, `events`, `testimonials`, `services`, `settings`).
- Admin write actions call `revalidateTag(...)` so the public site updates immediately after edits (satisfies the "site reflects admin changes instantly" acceptance criterion).
- Availability and account/admin data are never cached.

## 4. Data access

- **Prisma** as the single ORM. Client singleton in `lib/prisma.ts` (guards against dev hot-reload connection storms).
- **Neon** serverless Postgres with **pooled connection string** for serverless functions; a direct (non-pooled) URL is used only for migrations.
- Extensions: **`pgvector`** (semantic product search via embeddings) and **`pg_trgm`** (typo-tolerant fuzzy search). Enabled via Prisma migration.
- All money stored as **integer cents**; all dates stored UTC.

## 5. Authentication & authorization

- **NextAuth (Auth.js)** with a Credentials provider (email + hashed password via `bcrypt`/`argon2`).
- Two principal kinds:
  - **Customers** — self-registered; access only their own account data.
  - **Staff/Admin** — seeded/invited; access `/admin` gated by **RBAC**.
- **RBAC model:** `Role` ⇄ `Permission` (many-to-many), `AdminUser.role`. Permissions are granular (e.g. `product.write`, `booking.confirm`, `blog.publish`, `users.manage`). Every admin Server Action checks permission server-side; the UI hides controls the user lacks.
- **Activity Log** records every admin mutation (actor, action, entity, before/after, timestamp).

## 6. Media pipeline (Phase 5)

- Uploads go directly to **Cloudflare R2** via **presigned URLs** (S3-compatible API) — files never pass through the Vercel function body.
- Served via Cloudflare **CDN** with **Image Resizing/Optimization** (AVIF/WebP, responsive widths, quality tuning) behind `next/image` with a custom loader.
- A `MediaAsset` table tracks every uploaded object (key, url, type, dimensions, alt text, locale, usage) for the admin **Media Library**.
- **Design media rule:** real images/video are sourced at top quality, downloaded, then uploaded to R2 — never hotlinked.

## 7. Search (Phase 9)

- **Tier 1 — instant fuzzy:** Postgres `pg_trgm` similarity on product name/sku/tags (typo-tolerant, fast).
- **Tier 2 — semantic (AI):** an embedding is generated per product at index time and stored in a `pgvector` column; user queries are embedded and matched by cosine distance.
- Hybrid ranking merges both. Embeddings are regenerated when a product is created/edited (admin "reindex" action).

## 8. Internationalization (Phase 2 → all pages)

- **next-intl** with a `[locale]` route segment; `en` only. French was retired 2026-08-13 (US-only market); `/fr/*` 301s to `/en/*` in `middleware.ts`.
- **UI strings** in `messages/en.json`.
- **CMS content** (products, blog, events, services, testimonials) stores **per-locale fields/rows** so content is genuinely translated, not just chrome.
- `hreflang` + localized metadata handled in Phase 18.

## 9. Communications (Phase 17)

- **Email** via Nodemailer + Hostinger SMTP, with branded responsive HTML templates (React Email or MJML-style components) in `emails/`.
- **WhatsApp** — a floating click-to-chat (`wa.me`) for visitors, plus **WhatsApp Cloud API** for outbound staff/customer notifications on new requests.
- **Transactional triggers:** order request received, booking request received, staff "send payment details", quote estimate, contact auto-reply, abandoned-request reminder, newsletter welcome.

## 10. Order / booking / quote lifecycle (no payments)

```
ORDER:    PENDING ─▶ INVOICE_SENT ─▶ DEPOSIT_PAID ─▶ PAID_IN_FULL
                 └─────────────────────────────────▶ CANCELLED
BOOKING:  REQUESTED ─▶ CONFIRMED (dates hard-blocked, contract sent)
                 │                  └─▶ COMPLETED
                 └─▶ DECLINED / CANCELLED
          Payment status tracked separately (same enum as Order).
```

- On request submission: record created, **emails fire** to staff + customer, WhatsApp notification to staff.
- Rental dates are **tentatively held** on `REQUESTED`, only **hard-blocked** on admin `CONFIRMED` (prevents locking inventory for unpaid leads).
- Staff trigger the **payment-details email** from admin and advance status manually.

## 11. Performance, accessibility, security targets

- **Lighthouse ≥ 95** (Performance, Accessibility, Best Practices, SEO) on mobile.
- Heavy 3D (R3F) is **lazy-loaded** and **reduced-motion-aware**; never blocks first paint.
- WCAG **AA**: keyboard nav, focus management, ARIA, contrast (the `#0099FF`/`#111111` palette is contrast-checked).
- Security: Zod validation on every action, rate limiting on public forms, security headers, honeypots, server-side authz on every admin action, secrets only in env.

## 12. Key technology decisions (and rejected alternatives)

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Mutations | Server Actions | Separate REST/tRPC | Native to App Router, less boilerplate, type-safe end-to-end |
| Smooth scroll | Lenis | CSS scroll only | Lenis is the 2026 standard; syncs with GSAP ScrollTrigger |
| 3D | React Three Fiber | Plain Three.js / none | Declarative, React-friendly; the differentiator vs competitors |
| i18n | next-intl | next-i18next | Best App Router support |
| Search | pg_trgm + pgvector | Algolia / Meilisearch | Stays in Neon, no extra service/cost, satisfies "AI search" |
| E-sign | Custom canvas → PDF → R2 | DocuSign | No per-envelope fees; full control + audit trail |
| Payments | **None (request + email)** | Stripe | Per client requirement |
