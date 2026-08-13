# 02 — Database Schema (ERD)

> Phase 1 deliverable: the complete data model on paper. Implemented as Prisma + Neon in **Phase 4**. All money is integer **cents**; all timestamps **UTC**. Text fields once marked **(i18n)** are stored as JSON. The site is English-only since 2026-08-13; legacy rows may still carry a `{en, fr}` shape and `getLocalized` resolves them to English.

## Entity map

```
Customer ──< Order ──< OrderItem >── Product >── ProductCategory
   │           │                        │  │
   │           └── (PaymentStatus)      │  └─< ProductImage / ProductMedia
   │                                    │  └─< ProductVariation
   ├──< Booking ──< BookingItem >── RentalUnit >── Product
   │       ├── RentalContract (1:1)
   │       └── (PaymentStatus, tentative/hard hold)
   ├──< QuoteRequest ──< QuoteItem
   ├──< Review >── Product
   ├──< WishlistItem >── Product
   ├──< EventRegistration >── Event
   └── (CRM: notes, tags, lifetimeValue)

Cart ──< CartItem >── Product          (abandoned-request tracking)

BlogPost >── BlogCategory, Author, >── Tag (m:n)
Event ──< EventRegistration
Testimonial   Service   ContactInquiry   NewsletterSubscriber

AdminUser >── Role >──< Permission       MediaAsset      SiteSetting
ActivityLog >── AdminUser
```

## Enums

```prisma
enum ProductType      { SALE  RENTAL  BOTH }
enum ProductStatus    { DRAFT  ACTIVE  ARCHIVED  OUT_OF_STOCK }
enum OrderStatus      { PENDING  PROCESSING  FULFILLED  CANCELLED }
enum BookingStatus    { REQUESTED  CONFIRMED  COMPLETED  DECLINED  CANCELLED }
enum PaymentStatus    { PENDING  INVOICE_SENT  DEPOSIT_PAID  PAID_IN_FULL  CANCELLED }
enum QuoteStatus      { NEW  REVIEWED  QUOTED  WON  LOST }
enum ContractStatus   { DRAFT  SENT  SIGNED  VOID }
enum EventStatus      { UPCOMING  ONGOING  PAST  CANCELLED }
enum RegistrationStatus { PENDING  CONFIRMED  CANCELLED }
enum ReviewStatus     { PENDING  APPROVED  REJECTED }
enum TestimonialStatus{ PENDING  APPROVED  REJECTED }
enum PostStatus       { DRAFT  PUBLISHED  ARCHIVED }
// locale columns are plain String @default("en") — English-only site
enum AdminRoleType    { SUPER_ADMIN  ADMIN  EDITOR  SALES  SUPPORT }
```

## Catalog

### Product
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | string unique | per-locale slug map (i18n) |
| name | string | (i18n) |
| shortDescription | text | (i18n) |
| description | richtext | (i18n) |
| type | ProductType | SALE / RENTAL / BOTH |
| status | ProductStatus | |
| sku | string unique | |
| salePriceCents | int? | for sale items |
| dailyRateCents | int? | for rental items |
| depositCents | int? | rental deposit guidance |
| dimensions | json | L×W×H, weight |
| capacity | int? | riders / max occupancy |
| spaceRequired | string | (i18n) setup footprint |
| powerRequired | string | blower/power notes |
| ageRange | string | |
| features | json | bullet list (i18n) |
| categoryId | FK → ProductCategory | |
| embedding | vector(1536) | pgvector, for AI search |
| searchText | tsvector | generated, pg_trgm/full-text |
| ratingAvg | float | denormalized |
| ratingCount | int | denormalized |
| metaTitle/metaDescription | string | (i18n) SEO |
| createdAt / updatedAt | datetime | |

Relations: `images ProductMedia[]`, `variations ProductVariation[]`, `reviews Review[]`, `category ProductCategory`.

### ProductCategory
id, slug, name (i18n), description (i18n), image, parentId (self-relation for nesting), order, metaTitle/Description.

### ProductMedia
id, productId FK, type (`IMAGE|VIDEO`), r2Key, url, alt (i18n), width, height, order, isPrimary.

### ProductVariation
id, productId FK, name (i18n) (e.g. color/size), sku, priceDeltaCents, stock, image.

## Customer & CRM

### Customer
id, name, email unique, phone, passwordHash?, locale, marketingOptIn, **crmTags string[]**, **crmNotes** (admin-only), **lifetimeValueCents** (denormalized), organizationName?, organizationType? (individual/school/church/hotel/municipality/corporate), createdAt.
Relations: orders, bookings, quotes, reviews, wishlist, eventRegistrations.

## Sales (request-based, no payment)

### Order
id, orderNumber unique, customerId FK, status OrderStatus, **paymentStatus PaymentStatus**, subtotalCents, deliveryFeeCents, totalCents, **amountPaidCents**, **invoiceNote**, **paidAt?**, deliveryAddress json, contactPhone, locale, notes, createdAt.
Relations: items OrderItem[].

### OrderItem
id, orderId FK, productId FK, variationId?, name (snapshot), unitPriceCents, quantity, lineTotalCents.

### Cart  (abandoned-request recovery)
id, customerId?/sessionId, status (`ACTIVE|CONVERTED|ABANDONED`), lastActivityAt, reminderSentAt?.
Relations: items CartItem[] (productId, variationId?, quantity).

## Rentals (request-based)

### RentalUnit
id, productId FK, unitLabel (asset tag), conditionNotes, isActive.
(Multiple physical units per rental Product → enables real availability math.)

### Booking
id, bookingNumber unique, customerId FK, status BookingStatus, **paymentStatus PaymentStatus**, eventStartDate, eventEndDate, **holdType (`TENTATIVE|HARD`)**, eventType, headcount, surfaceType, eventAddress json, subtotalCents, deliveryFeeCents, pickupFeeCents, depositCents, totalCents, amountPaidCents, balanceDueCents, invoiceNote, locale, notes, createdAt.
Relations: items BookingItem[], contract RentalContract?.

### BookingItem
id, bookingId FK, rentalUnitId FK (or productId for soft hold), name (snapshot), dailyRateCents, days, lineTotalCents.

### RentalContract
id, bookingId FK unique, status ContractStatus, contractNumber, **r2Key/pdfUrl** (generated PDF), **signatureImageR2Key**, signerName, signedAt?, ipAddress, **auditTrail json** (events: generated/sent/viewed/signed), createdAt.

## Quotes (everywhere: shop, rent, services)

### QuoteRequest
id, quoteNumber unique, customerId? (or guest name/email/phone), status QuoteStatus, context (`SHOP|RENTAL|SERVICE|GENERAL`), eventDate?, message, estimateCents?, staffNotes, locale, createdAt.
Relations: items QuoteItem[] (productId?/serviceId?, label, quantity, notes).

## Reviews & Wishlist

### Review
id, productId FK, customerId FK (or guest name), rating (1–5), title, body, status ReviewStatus, createdAt.

### WishlistItem
id, customerId FK, productId FK, createdAt. (unique [customerId, productId])

## Events

### Event
id, slug, title (i18n), excerpt (i18n), description (i18n), status EventStatus, startAt, endAt, location, coverImage (r2), galleryMedia json, capacity?, registrationEnabled bool, metaTitle/Description (i18n).
Relations: registrations EventRegistration[].

### EventRegistration
id, eventId FK, customerId? / name+email+phone, partySize, status RegistrationStatus, notes, createdAt.

## Blog

### BlogPost
id, slug, title (i18n), excerpt (i18n), content richtext (i18n), coverImage (r2), status PostStatus, publishedAt?, readingMinutes, authorId FK, categoryId FK, **tags Tag[] (m:n)**, viewCount, metaTitle/Description/ogImage (i18n).
### BlogCategory  id, slug, name (i18n), description (i18n).
### Tag  id, slug, name (i18n).
### Author  id, name, bio (i18n), avatar (r2), socials json, (optional link to AdminUser).

## Content / Marketing

### Service
id, slug, title (i18n), summary (i18n), description (i18n), icon, heroImage (r2), gallery json, included json (i18n), order, category (`EVENT|INSTALL|MAINTENANCE|SUPPORT`), metaTitle/Description.
### Testimonial
id, authorName, authorRole, organization?, rating (1–5), quote (i18n), avatar (r2)?, videoUrl (r2)?, status TestimonialStatus, featured bool, order, createdAt.
### ContactInquiry
id, name, email, phone, subject, message, source page, status (`NEW|IN_PROGRESS|RESOLVED`), assignedToId?, locale, createdAt.
### NewsletterSubscriber
id, email unique, locale, status (`SUBSCRIBED|UNSUBSCRIBED`), source, createdAt.

## Admin / Governance

### AdminUser
id, name, email unique, passwordHash, roleId FK, isActive, lastLoginAt, twoFactorEnabled?, createdAt.
### Role  id, name, type AdminRoleType, description. Relations: permissions Permission[] (m:n), users AdminUser[].
### Permission  id, key (e.g. `product.write`), label, group.
### ActivityLog  id, actorId FK → AdminUser, action, entityType, entityId, summary, diff json, ip, createdAt.
### MediaAsset  id, r2Key unique, url, type (`IMAGE|VIDEO|DOC`), mimeType, sizeBytes, width?, height?, alt (i18n), folder, uploadedById, usageRefs json, createdAt.
### SiteSetting  id, key unique, value json, group (e.g. `general|contact|fees|integrations|social`), updatedById. Holds delivery-fee rules, business hours, WhatsApp number, social links, etc.

## Indexing notes (Phase 4)
- `pg_trgm` GIN index on `Product.name`, `sku`, tags.
- `pgvector` IVFFlat/HNSW index on `Product.embedding`.
- Unique business keys: order/booking/quote/contract numbers.
- Composite indexes: `Booking(rentalUnitId, eventStartDate, eventEndDate)` for availability overlap checks; `Order(customerId, createdAt)`; `BlogPost(status, publishedAt)`.
