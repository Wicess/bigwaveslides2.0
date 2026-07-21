# Big Wave Slides — PRODUCT.md

## Register

Split-register project. Default: **brand** (public marketing + e-commerce site — design IS the product). The `/admin` panel is **product** register (design SERVES the workflow); treat any `/admin/*` task as product.

## Users & Purpose

- **Public site (EN/FR):** US parents, schools, churches, HOAs, and event planners renting or buying commercial inflatable water slides. Primary job: check a slide, a date, and a price, then request a quote with zero friction. Emotions: summer fun, safety, trust (no-online-payment business — trust signals are load-bearing).
- **Admin panel:** the owner (solo operator, often on a phone via ntfy pushes) managing quotes → invoices → manual payments, bookings, catalog, blog, CRM. Primary job per screen: see what needs action *now* (post payment details, verify a payment, confirm a date) and do it in one or two taps.

## Brand personality

Premium, energetic, trustworthy. "Big waves, bigger smiles." Superior in polish to WhiteWaterWest/ProSlide. Never childish or clip-arty despite the kids' party domain.

## Visual identity (committed)

- **Public:** Primary #0099FF · Secondary #00D4FF · Accent #003366 · white bg · glassmorphism accents · kinetic type · GSAP/Framer motion.
- **Admin:** warm "Cocoa & Amber" theme — dark cocoa canvas (#3a2218), cream panel (#f4ece3), white cards, amber gradient (#f59140→#e2620f) for primary actions/active states, generous radius (--radius-lg 1.5rem), soft warm shadows, CSS rise/pop entrance motion (`.admin-rise`), Inter/font-display pairing.

## Anti-references

Generic bootstrap-admin gray dashboards; SaaS hero-metric clichés; neon/childish party-rental sites; anything that reads "template".

## Non-negotiables

- No on-site card payments — manual rails (Zelle/Cash App/…) with trust-building UX.
- Bilingual EN/FR on all public surfaces; admin is EN-only.
- prefers-reduced-motion safe; Lighthouse 95+ on public pages.
- Admin actions must be phone-friendly (owner works from ntfy pushes on mobile).
