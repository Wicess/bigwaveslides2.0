# Build: Manual Payment Rails + Admin-Assigned Payment Details

Implement a manual/offline payment system for my e-commerce checkout. There is no
card processor — buyers pay via peer-to-peer rails (Zelle, Cash App, Chime, Apple
Pay, crypto), and the store owner either pre-configures a rail's destination or
assigns payment details per-order by hand. The whole system exists to make that
manual step feel instant, secure, and trustworthy to the buyer.

## Stack assumptions

Next.js (App Router) + TypeScript + Prisma/Postgres + Tailwind + Resend for email
+ sonner for toasts. Adapt names if my stack differs, but keep the architecture.

---

## 1. Data model

```prisma
model PaymentMethodConfig {
  id           String   @id @default(cuid())
  method       String   @unique   // "zelle" | "cash-app" | "chime" | "crypto" | custom
  label        String             // display name, e.g. "Cash App"
  destination  String   @default("")   // handle / tag / wallet address
  instructions String   @default("") @db.Text // template w/ {{amount}} {{orderNumber}} {{destination}} {{network}}
  network      String?            // crypto only, e.g. "USDT · TRON (TRC-20)"
  qrImageUrl   String?
  enabled      Boolean  @default(false)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Add to the `Order` model:

```prisma
  paymentDetailsState String  @default("AWAITING_DETAILS")
  // AWAITING_DETAILS | DETAILS_SENT | PROOF_SUBMITTED | PAID | REJECTED
  paymentMethodKey    String?
  paymentMethodLabel  String?
  paymentDestination  String?
  paymentInstructions String?  @db.Text
  paymentNetwork      String?
  paymentQrUrl        String?
```

## 2. Payment-methods library (`lib/payment-methods.ts`)

- `DEFAULT_METHODS`: canonical list (cash-app, apple-pay, zelle, chime, crypto)
  with instruction templates, so the admin editor renders all rails before any
  DB row exists.
- `loadPaymentMethods()`: DB rows merged over defaults, sorted by `sortOrder`.
- `savePaymentMethods(list)`: upsert each by `method` slug.
- `resolvePaymentDetails(method, { amountCents, orderNumber })`: returns filled
  details ONLY if the rail is `enabled` AND has a non-empty `destination`;
  otherwise `null` → order falls back to the manual "awaiting" path.
- `buildInstructionsForMethod(method, ctx)`: fills the template when the owner
  posts details for a rail that was never pre-configured (owner types only the
  destination; instructions auto-generate).
- Template fill = replace `{{amount}}`, `{{orderNumber}}`, `{{destination}}`,
  `{{network}}`.

## 3. Checkout behaviour

On order creation:

- Call `resolvePaymentDetails()` for the chosen rail.
- If resolved → persist details, `paymentDetailsState = "DETAILS_SENT"`.
- If not → `paymentDetailsState = "AWAITING_DETAILS"`, details null.

**Critical:** do NOT send a generic "order confirmation" email. The buyer gets
exactly ONE order email — the payment-instructions email — sent either
immediately (details resolved) or the moment the owner posts details. Two emails
confuses buyers into thinking they've already paid. If details are pending, log
`"client email → deferred until owner posts payment details"` and return
`emailDelivered: false`.

Fire owner alerts on every order (all independently try/caught so one failure
can't kill the others):

- **ntfy.sh push** (priority 5, overrides Do Not Disturb) with a tappable action
  linking straight to the admin order page. Message must distinguish
  `"✅ payment details auto-sent"` vs `"⚠️ NEEDS payment details — open & post them"`.
- Admin email + (optional) Telegram.

## 4. Admin: payment rails editor

Page at `/admin/settings/payments` with a form listing every method:
enabled toggle, display name, destination, optional QR URL, instructions
textarea (showing which `{{placeholders}}` are available). Saves via
`PUT /api/admin/payment-methods` — validate with zod, upsert, return the fresh
list, and revalidate the checkout success path.

## 5. Admin: per-order payment actions

`POST /api/admin/orders/[id]/payment` with a discriminated union:

- `{ action: "post-details", destination, qrUrl? }` — owner types ONLY the
  destination; generate instructions from the rail's template, persist, set
  state `DETAILS_SENT`, then **immediately**:
  - send the payment-instructions email (amount, destination, QR, filled
    instructions, order summary, link to upload proof)
  - send a web-push notification to the buyer's session ("Your payment details
    are ready 💳") so it reaches them even with the tab closed
- `{ action: "mark-paid" }` — state `PAID`, paymentStatus `PAID`, status `PROCESSING`
- `{ action: "reject", reason? }` — state `REJECTED` so the buyer can resubmit proof

## 6. Real-time reveal (the important part)

**Status endpoint** `GET /api/orders/[number]/status?email=` — returns
`{ state, hasDetails, paid }`. Authorize by matching the logged-in session email
OR the `?email=` param against the order, so it never leaks another order's state.

**`PendingOrderFlag`** (rendered on the order page): writes
`localStorage["pending_order"] = { number, email }` while state is
`AWAITING_DETAILS`; clears it once details arrive or the order is paid.

**`PaymentWatcher`** — mounted ONCE in the root layout so it runs on every page:

- polls the status endpoint every 6s, gives up after 25 min
- also re-checks on `visibilitychange` (mobile/PWA throttle background timers,
  so this makes the reveal feel instant when they return to the tab)
- when `hasDetails` flips true: clear the flag, set a `sessionStorage` announce
  marker, dispatch a `ready` event, then **`router.refresh()` if the buyer is on
  the order page, or `router.push()` back to the order page if they wandered off**
- dispatch a `poll` event on every completed check so the UI can show a heartbeat

> ⚠️ **BUG TO AVOID (I hit this):** do NOT read the localStorage flag once when
> the watcher mounts. The order page writes that flag in its own effect, which
> runs _after_ the watcher's — so on the exact page where the buyer waits, the
> watcher never starts polling. **Re-read the flag inside every tick.** Track
> per-order "first seen" time in a Map for the timeout instead of a mount-time
> constant.

## 7. Waiting UI — make the manual step feel like security, not lag

While `AWAITING_DETAILS`, render a premium staged checklist card:

```
SECURE CHECKOUT                    🛡 PROTECTED ORDER
Setting up your payment
  ✓ Order received
  ✓ Items reserved for you
  ● Assigning your secure payment channel      [~10–15 MIN]
    Payment details are issued individually for every order —
    it keeps your payment protected and verifiable.
    [indeterminate scanning bar]
    Elapsed 38s   ● Checked just now
  ┌────────────────────────────────────────────┐
  │ No need to wait on this page. Your payment │
  │ details will appear here automatically the │
  │ moment they're issued — and we'll email    │
  │ them to you with full instructions too.    │
  └────────────────────────────────────────────┘
```

Requirements:

- **Live elapsed timer** ticking every second since order creation.
- **Truthful poll heartbeat** — listen for the watcher's `poll` event and show
  "Checked just now / 8s ago". This is the trust anchor: it proves the system is
  actively working, and it's honest because the check really happened.
- **Indeterminate** scan bar — never a fake completion percentage.
- Calm breathing dot on the active step (~2.6s cycle), NOT a frantic spinner.
- Honest ETA chip; set it to a window you can actually hit.
- Staggered entrance (~0.35s apart), transform/opacity only, `motion-safe:` gated.

> **Honesty constraint:** frame the real process well, never invent fake backend
> steps ("encrypting with AES-256") that don't happen. Everything above is true:
> details ARE issued per order, the page IS polling, time HAS elapsed.

## 8. Arrival signal — details must never appear silently

If the details just swap in, buyers miss them and never pay. On arrival, fire
ALL of these (layered so at least one lands):

1. **Toast** — "Your payment details are ready" + description + a _View_ action
   that scrolls to the card (10s duration)
2. **Highlight ring pulse** on the details card (~2.6s, fades out)
3. **Scroll into view** (`behavior: "smooth", block: "center"`)
4. **Tab title flash** — alternate "💳 Payment details ready!" with the original
   title every 900ms; stop on window focus or after 30s (catches a backgrounded tab)
5. **Haptic** — `navigator.vibrate?.([90, 60, 90])`
6. A **"CHANNEL READY"** badge on the card, closing the loop on the promise

Trigger via a `sessionStorage` marker set by the watcher (survives the
refresh/redirect) OR the in-page `ready` event when no navigation happened.

> ⚠️ **BUG TO AVOID (I hit this too):** React's development double-invoke will
> swallow this. If the effect reads-and-deletes the marker on its first pass and
> schedules the announcement in a `setTimeout`, the discarded pass deletes the
> marker AND the cleanup clears the timer — so nothing ever fires. **Consume the
> marker only inside the announcement function itself, guarded by a `useRef`
> that survives the double-invoke.**

## 9. Buyer proof upload

Below the details: screenshot upload + optional transaction ID + "I've paid —
submit proof" → sets `PROOF_SUBMITTED` and alerts the owner. Show a confirmed
state when `PAID`.

---

## Non-obvious gotchas that will cost you hours

1. **Pin the canonical origin in any script/cron that sends email.** If your
   `SITE_URL` falls back to `NEXT_PUBLIC_APP_URL` (localhost in `.env.local`),
   every link and the derived contact address in your emails will say
   `contact@localhost:3000`. Set `NEXT_PUBLIC_SITE_URL` **before** importing the
   module that derives it.
2. **Resend returns API errors in an `error` field instead of throwing.** Without
   an explicit `if (error) throw` check, rejected sends get counted as delivered.
3. **A Resend "Sending access" key returns 401 on `GET /emails`.** Any delivery-
   status sync feature needs a **full-access** key.
4. **Flex children need `min-w-0`** or long unbreakable values (payment
   addresses, order paths) blow out the card width on mobile.
5. **Verify with a real browser, not just API calls.** Both bugs above were
   invisible to endpoint tests — only driving a real browser (Chrome DevTools
   Protocol / Playwright) surfaced them.

## Acceptance test (automate this end-to-end in a real browser)

1. Place an order on a rail with no configured destination → state
   `AWAITING_DETAILS`, **no** confirmation email, owner gets the ntfy alert
2. Buyer opens the order page → stepper renders, flag written, **heartbeat
   updates within ~8s** (proves the watcher actually polls on this page)
3. Buyer navigates to another page
4. Owner posts details in admin
5. Buyer is **auto-redirected back** to the order page
6. Details revealed + toast + title flash + scroll-into-view all fire
7. Pending flag cleared (no redirect loop)
8. Payment-instructions email delivered (verify via the provider API)
