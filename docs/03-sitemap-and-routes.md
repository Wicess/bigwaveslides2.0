# 03 — Sitemap & Route Map

> All public routes are localized under `/[locale]` where `locale ∈ {en, fr}`. `en` is the default. Admin is **not** localized (`/admin`).

## Public site map

```
/[locale]
├── /                         Home
├── /about                    About Us
├── /services                 Services (overview)
│   └── /services/[slug]      Individual service (birthday, pool, school, church,
│                             corporate, family, festivals, community,
│                             installation, maintenance, emergency-support)
├── /shop                     Shop catalog (filters, AI search)
│   ├── /shop/category/[slug] Category listing
│   └── /shop/[slug]          Product detail (gallery, 360°, reviews, wishlist, quote)
├── /rent                     Rental catalog
│   ├── /rent/[slug]          Rental detail (availability calendar, instant quote)
│   └── /rent/checkout        Booking request flow (event details → request)
├── /cart                     Cart (request order — no payment)
├── /quote                    Request-a-Quote (general)
├── /events                   Events list + calendar
│   └── /events/[slug]        Event detail (gallery, registration)
├── /blog                     Blog index (categories, tags, search)
│   ├── /blog/category/[slug] Category archive
│   ├── /blog/tag/[slug]      Tag archive
│   └── /blog/[slug]          Post detail
├── /testimonials             Testimonials + leave-a-review
├── /contact                  Contact (form, map, WhatsApp)
├── /faq                      FAQ (with FAQ schema)
├── /privacy-policy           Privacy Policy
├── /terms-of-service         Terms of Service
└── /account                  Customer area (auth-gated)
    ├── /account/orders
    ├── /account/bookings
    ├── /account/contracts
    ├── /account/quotes
    ├── /account/wishlist
    └── /account/profile
```

## Auth routes
```
/[locale]/sign-in
/[locale]/sign-up
/[locale]/forgot-password
/[locale]/reset-password
```

## Admin map (not localized, RBAC-gated)
```
/admin
├── /                         Dashboard (KPIs, pipeline, GA/Clarity tiles)
├── /products                 Products (sale & rental) + variations + reindex
├── /products/categories
├── /inventory                Rental units & availability
├── /bookings                 Booking requests (calendar, confirm, contracts)
├── /orders                   Order requests (send payment details, status)
├── /quotes                   Quote requests
├── /events                   Events + registrations
├── /blog                     Posts, categories, tags, authors
├── /testimonials             Approve / reject
├── /reviews                  Approve / reject
├── /customers                CRM (profiles, notes, tags, history)
├── /media                    Media Library (R2)
├── /email                    Email templates & campaigns
├── /newsletter               Subscribers
├── /contacts                 Contact inquiries inbox
├── /settings                 Site settings, fees, integrations
├── /users                    Admin users
├── /roles                    Roles & permissions
└── /activity                 Activity logs
```

## API / route handlers (only where a handler is required)
```
/api/auth/[...nextauth]       NextAuth
/api/r2/presign               Presigned upload URL (auth-gated)
/api/search                   Hybrid product search (trgm + pgvector)
/api/availability             Real-time rental availability
/api/whatsapp/webhook         WhatsApp delivery/status receipts
/api/og                       Dynamic Open Graph image generation
/api/revalidate               On-demand ISR revalidation (secured)
/sitemap.xml  /robots.txt     SEO (Phase 18)
```

## Navigation (mega-menu — Phase 6)
- **Shop** ▸ featured categories + "Best sellers" + CTA
- **Rent** ▸ rental categories + "Check availability" + CTA
- **Services** ▸ event services / installation / maintenance / support
- **Events**, **Blog**, **About**, **Contact**
- Persistent CTAs: **Get a Quote**, **Rent Now**; icons: search, wishlist, cart, account, locale switcher (EN/FR)
- Floating **WhatsApp** button on all pages
