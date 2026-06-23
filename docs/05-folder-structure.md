# 05 — Folder Architecture

> Target structure (built incrementally across phases). Clean separation: `app/` = routing/UI, `components/` = reusable UI, `lib/` = pure utilities/clients, `server/` = server-only logic (actions, services, data access), `prisma/` = schema/seed, `messages/` = i18n, `emails/` = templates.

```
big-wave-slides/
├── app/
│   ├── [locale]/                     # localized public site (en/fr)
│   │   ├── (marketing)/              # route group: home, about, services, faq, legal
│   │   │   ├── page.tsx              # Home
│   │   │   ├── about/page.tsx
│   │   │   ├── services/[[...slug]]/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── privacy-policy/page.tsx
│   │   │   └── terms-of-service/page.tsx
│   │   ├── (shop)/
│   │   │   ├── shop/...              # catalog, category, product detail
│   │   │   ├── cart/page.tsx
│   │   │   └── quote/page.tsx
│   │   ├── (rent)/rent/...           # catalog, detail, checkout (booking request)
│   │   ├── (content)/
│   │   │   ├── events/...
│   │   │   ├── blog/...
│   │   │   └── testimonials/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── account/...               # auth-gated customer area
│   │   ├── (auth)/                   # sign-in, sign-up, reset
│   │   ├── layout.tsx                # locale layout (header/footer, providers)
│   │   ├── loading.tsx  error.tsx  not-found.tsx
│   ├── admin/                        # NOT localized; RBAC-gated
│   │   ├── layout.tsx                # admin shell (sidebar/topbar)
│   │   ├── page.tsx                  # dashboard
│   │   └── <module>/...              # products, bookings, orders, customers, ...
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── r2/presign/route.ts
│   │   ├── search/route.ts
│   │   ├── availability/route.ts
│   │   ├── whatsapp/webhook/route.ts
│   │   ├── og/route.tsx
│   │   └── revalidate/route.ts
│   ├── sitemap.ts  robots.ts
│   └── globals.css
│
├── components/
│   ├── ui/                           # shadcn primitives (button, dialog, ...)
│   ├── motion/                       # Reveal, KineticText, LenisProvider, gsap utils
│   ├── three/                        # R3F canvas, wave scene, 360° viewer
│   ├── layout/                       # header, mega-menu, footer, whatsapp-fab
│   ├── sections/                     # home/about/services section blocks
│   ├── shop/  rent/  blog/  events/  # feature components
│   ├── admin/                        # data-table, drawer-form, media-picker, charts
│   └── forms/                        # RHF + Zod field components
│
├── server/
│   ├── actions/                      # Server Actions (typed, Zod-validated)
│   │   ├── orders.ts  bookings.ts  quotes.ts  reviews.ts  contact.ts
│   │   ├── auth.ts  admin/*.ts
│   ├── services/                     # domain logic
│   │   ├── availability.ts           # overlap math, tentative/hard holds
│   │   ├── search.ts                 # trgm + pgvector hybrid
│   │   ├── pricing.ts                # fees, totals
│   │   ├── contract.ts               # PDF generation + e-sign
│   │   ├── email.ts                  # send via Hostinger SMTP
│   │   ├── whatsapp.ts               # Cloud API notifications
│   │   └── embeddings.ts             # product embeddings
│   ├── data/                         # cached read queries (tags)
│   └── auth/                         # nextauth config, rbac guards
│
├── lib/
│   ├── env.ts                        # typed env (zod-validated)
│   ├── prisma.ts                     # client singleton
│   ├── r2.ts                         # S3-compatible client
│   ├── cn.ts  format.ts  constants.ts
│   └── analytics.ts                  # GA4 + Clarity helpers
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── messages/  en.json  fr.json       # next-intl UI strings
├── i18n.ts  middleware.ts            # locale routing + auth middleware
├── emails/                           # branded transactional templates
├── content/                          # MDX/static where useful
├── public/                           # favicons, static svg (media lives in R2)
├── docs/                             # this documentation
├── tests/                            # unit + e2e (Phase 19)
├── .env.example
├── tailwind.config.ts  next.config.ts  tsconfig.json
└── package.json
```

## Conventions
- **Server-only code** never imported into client components; enforced with `server-only` package.
- **Server Actions** validate input with **Zod** at the boundary; return typed results.
- **One responsibility per file**; co-locate component + its variants.
- **No secrets** outside `lib/env.ts` (validated). Client-exposed vars prefixed `NEXT_PUBLIC_`.
- **Money** = integer cents helpers in `lib/format.ts`. **Dates** = UTC, formatted at render per locale.
