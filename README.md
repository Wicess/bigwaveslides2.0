# Splash Republic 🌊

World-class platform for **Splash Republic** — a US company that **sells, rents, and installs** water slides and provides **event services** for individuals, organizations, schools, churches, hotels, and municipalities.

> Goal: a design and experience **superior to** WhiteWaterWest.com, ProSlide.com, Aquarena.com, and Polin.com.tr — ultra-premium, motion-rich, water-inspired, and conversion-focused.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Styling | TailwindCSS, shadcn/ui + Radix, glassmorphism design system |
| Motion | Framer Motion, GSAP + ScrollTrigger, Lenis (smooth scroll), React Three Fiber (3D) |
| Backend | Next.js Server Actions, Prisma ORM |
| Database | Neon PostgreSQL (+ `pgvector` for AI search, `pg_trgm` for fuzzy search) |
| Storage / CDN | Cloudflare R2 + CDN + Image Optimization |
| Email | Hostinger SMTP (via Nodemailer) |
| Auth | NextAuth (Auth.js) with role-based access control |
| Forms | React Hook Form + Zod |
| i18n | next-intl (English / French) |
| Analytics | Google Analytics 4 + Microsoft Clarity |
| Messaging | WhatsApp (click-to-chat + Business Cloud API notifications) |
| Hosting | Vercel |

## Important: No On-Site Payments

This platform does **not** process payments online. All orders, bookings, and quotes are **request-based**: captured to the database and emailed to staff + customer. Staff send payment details manually and track status in the admin panel (`PENDING → INVOICE_SENT → DEPOSIT_PAID → PAID_IN_FULL → CANCELLED`).

## 🚀 Deploying to production

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete, copy‑paste launch guide — Neon, Cloudflare R2, Hostinger SMTP, Vercel env vars + cron, domain setup at `bigwavesslides.com`, migration/seed, and a pre‑launch checklist.

Quality gates: `npm run typecheck && npm run lint && npm run test`.

## Build Plan

Delivered in **20 phases**, one at a time. See [`PROGRESS.md`](./PROGRESS.md) for status and [`docs/`](./docs) for the full architecture, database design, sitemap, wireframes, and strategy.

## Documentation

- [`docs/01-architecture.md`](./docs/01-architecture.md) — system architecture & decisions
- [`docs/02-database-schema.md`](./docs/02-database-schema.md) — full data model (ERD)
- [`docs/03-sitemap-and-routes.md`](./docs/03-sitemap-and-routes.md) — sitemap & route map
- [`docs/04-wireframes.md`](./docs/04-wireframes.md) — low-fidelity wireframes
- [`docs/05-folder-structure.md`](./docs/05-folder-structure.md) — folder architecture
- [`docs/06-strategy-i18n-seo-analytics.md`](./docs/06-strategy-i18n-seo-analytics.md) — i18n, SEO & analytics strategy
