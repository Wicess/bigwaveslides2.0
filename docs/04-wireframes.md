# 04 — Low-Fidelity Wireframes

> Structural blueprints (not final visuals). Design language: ultra-premium, glassmorphism, tight vertical rhythm (sections hug), kinetic type, water-inspired motion. Colors: Primary `#0099FF`, Secondary `#00D4FF`, Accent `#003366`, BG `#FFFFFF`, Text `#111111`.

## Global shell
```
┌──────────────────────────────────────────────────────────────┐
│ [LOGO]   Shop  Rent  Services  Events  Blog  About  Contact   │  ← glass sticky header,
│                          🔍  ♡  🛒  👤  EN/FR   [ Get a Quote ]│    shrinks on scroll
└──────────────────────────────────────────────────────────────┘
                         ... page content ...
┌──────────────────────────────────────────────────────────────┐
│ FOOTER: Brand+blurb │ Quick links │ Services │ Contact+social  │
│ Newsletter signup  │ Trust badges │ © Legal  │ EN/FR           │
└──────────────────────────────────────────────────────────────┘
                                            (●) ← floating WhatsApp
```

## HOME
```
┌─ HERO ───────────────────────────────────────────────────────┐
│  [ Looping video bg + animated SVG/R3F waves + parallax ]     │
│  KINETIC HEADLINE: "Ride the Big Wave"                        │
│  Subcopy. [ Shop Slides ]  [ Rent for Your Event ]            │
│  ▸ mini "check your date" widget (date → availability)        │
└──────────────────────────────────────────────────────────────┘
[ TRUST BAR ]  ★4.9 (320+ reviews) · Insured · Clean · On-time · partner logos
[ FEATURED SLIDES ]  card card card card  (hover 3D tilt, quick-view)
[ RENTAL CATEGORIES ]  Birthday | Pool | School | Church | Corporate ...
[ SERVICES ]  icon grid → scrollytelling "How renting works in 3 steps" (GSAP pin)
[ WHY CHOOSE US ]  glass stat counters + differentiators
[ UPCOMING EVENTS ]  horizontal scroll cards
[ TESTIMONIALS ]  video/photo carousel, big rating
[ LATEST BLOG ]  3 cards
[ CONTACT CTA ]  full-bleed wave band + "Get a Quote" + newsletter
```

## SHOP (catalog)
```
┌ Search (AI, typo-tolerant) ───────────────┐  Sort ▾
│ Filters    │  product  product  product    │
│ ─ category │  product  product  product    │
│ ─ price    │  product  product  product    │
│ ─ size     │      [ load more / pagination ]│
│ ─ rating   │                                │
└────────────┴────────────────────────────────┘
```

## PRODUCT DETAIL
```
┌ Gallery / 360° R3F viewer ┐  ┌ Title + ★rating ───────────┐
│  [ main media ]           │  │ Price / "Request a Quote"  │
│  [thumb][thumb][video]    │  │ Variations ▾  Qty           │
└───────────────────────────┘  │ [ Add to Cart ] [ ♡ Wish ] │
                               │ specs · dimensions · power  │
                               └────────────────────────────┘
[ Description (tabs) ] [ Specs ] [ Reviews ★ + submit ]
[ Related products ]
```

## RENT (detail + booking)
```
┌ Media ┐  ┌ Daily rate · deposit · space/power needs ───────┐
│       │  │ AVAILABILITY CALENDAR (real-time, blocked dates)│
│       │  │ Pick dates → days → [ Add to booking ]          │
└───────┘  │ [ Get Instant Quote ]                           │
           └─────────────────────────────────────────────────┘
BOOKING REQUEST (/rent/checkout):
  event date/time · address · surface · headcount · units · add-ons
  → totals + delivery/pickup fee  → [ Submit Request ]
  (no payment — "we'll email your payment details to confirm")
```

## EVENTS
```
[ Calendar toggle | Grid ]   filter: upcoming / past
card card card  (lightbox gallery)  → detail + [ Register ]
```

## BLOG
```
[ Featured post hero ]
categories · tags · search
post post post   (pagination)
DETAIL: cover · title · author · reading time · rich content · share · related
```

## TESTIMONIALS
```
Big ★4.9 (count)
[ video review ] [ photo quote ] [ quote ] ...
[ Leave a Review ] form → pending approval
```

## CONTACT
```
┌ Form: name · email · phone · subject · message ┐  ┌ Info ┐
│ [ Send ] (→ email + DB)                         │  │ map  │
└─────────────────────────────────────────────────┘  │ hours│
[ WhatsApp ] [ Call ] [ Email ]                       │social│
```

## ADMIN (shell)
```
┌ Sidebar ────────┐ ┌ Topbar: search · notifications · profile ─────┐
│ Dashboard       │ │                                               │
│ Products        │ │  KPI cards: requests · confirmed · revenue    │
│ Inventory       │ │  pipeline · upcoming bookings · GA/Clarity    │
│ Bookings        │ │  charts · recent activity                     │
│ Orders          │ │                                               │
│ Quotes          │ │  (module pages: data table + filters + drawer │
│ Customers (CRM) │ │   editor + media picker + confirm dialogs)    │
│ Events / Blog   │ │                                               │
│ Media / Email   │ └───────────────────────────────────────────────┘
│ Users / Roles   │
│ Settings / Logs │
└─────────────────┘
```

## States (every page — Phase quality rule)
- **Loading:** skeleton loaders matching layout.
- **Empty:** friendly illustration + CTA.
- **Error:** retry + support/WhatsApp link.
- **Success:** toast + inline confirmation.
