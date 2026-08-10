# 🚀 Big Wave Slides — Production Launch Guide

Everything needed to take the site live at **https://bigwavesslides.com**.
Work top to bottom. Most steps are one‑time. Estimated time: **60–90 minutes**
(plus DNS propagation).

> **No on‑site payments.** Orders, bookings, and quotes are *requests* — staff
> follow up by email with payment details. There is no Stripe/PayPal to configure.

---

> **Already configured locally.** Neon (DATABASE_URL/DIRECT_URL) and Cloudflare
> R2 credentials are already in `.env.local` from the build phase, so local dev
> works out of the box. Sections 1–2 below are only reference for *where those
> came from* — for launch you mainly need to copy the same values into Vercel
> (Section A) and supply the Hostinger mailbox password. You do **not** need to
> recreate the Neon DB or R2 bucket.

## 0. Accounts you'll need

| Service | Purpose | Free tier OK? |
|---|---|---|
| **Vercel** | Hosting + cron | Yes (Hobby) — Pro recommended for production |
| **Neon** | PostgreSQL database (+ pgvector) | Yes |
| **Cloudflare R2** | Media storage + CDN | Yes (10 GB) |
| **Hostinger** | `contact@bigwavesslides.com` email (SMTP) | With your email plan |
| **Meta WhatsApp** | (optional) booking notifications | Yes |
| **Google Analytics + Microsoft Clarity** | (optional) analytics | Yes |
| Domain registrar for **bigwavesslides.com** | DNS | — |

---

## 1. Provision the database (Neon)

1. Create a project at <https://neon.tech> → region closest to your customers.
2. In **Connection Details**, copy **two** connection strings:
   - **Pooled** (has `-pooler` in the host) → this is `DATABASE_URL`
   - **Direct** (no `-pooler`) → this is `DIRECT_URL`
   Both should end with `?sslmode=require`.
3. Keep them for Step 5.

> pgvector + pg_trgm extensions are enabled by the migrations automatically.

---

## 2. Provision media storage (Cloudflare R2)

1. Cloudflare dashboard → **R2** → **Create bucket** → name it `bigwaveslides`.
2. Settings → **Public access**: enable an `r2.dev` public URL, or (recommended)
   connect a custom domain `media.bigwavesslides.com`.
3. **Manage R2 API Tokens** → create a token with **Object Read & Write** →
   copy the **Access Key ID** and **Secret Access Key**.
4. Note your **Account ID** (R2 overview page).
   - `R2_ENDPOINT` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `R2_PUBLIC_URL` = your public bucket URL (e.g. `https://media.bigwavesslides.com`)

---

## 3. Set up email (Hostinger SMTP)

1. In Hostinger → **Emails**, create the mailbox **contact@bigwavesslides.com**.
2. SMTP settings (Hostinger standard):
   - Host `smtp.hostinger.com` · Port `465` (SSL)
   - User `contact@bigwavesslides.com` · Password = the mailbox password
3. These map to `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.

---

## 4. Generate your secrets

Run locally (or anywhere with openssl) and keep the output:

```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "CRON_SECRET=$(openssl rand -base64 32)"
echo "WHATSAPP_VERIFY_TOKEN=$(openssl rand -hex 16)"
```

---

## 5. Deploy to Vercel

1. Push this repo to GitHub (if not already): `git push origin master`.
2. <https://vercel.com/new> → **Import** the repository.
3. Framework preset auto‑detects **Next.js**. Leave build settings default
   (`next build`; install runs `prisma generate` via `postinstall`).
4. Expand **Environment Variables** and paste every variable from
   **Section A** below (set them for **Production** — and Preview if you want).
5. Click **Deploy**. The first build also wires the **cron job** from
   `vercel.json` (hourly abandoned‑cart sweep).

---

## 6. Run the database migration + seed

After the first deploy, from your machine (uses `DIRECT_URL`):

```bash
# .env.local must contain DATABASE_URL and DIRECT_URL (the Neon strings)
npm install
npx prisma migrate deploy      # applies all migrations to Neon
npm run db:seed                # categories, products, services, admin user, settings…
```

> `migrate deploy` is the production‑safe command (no prompts). Re‑running the
> seed is idempotent.

---

## 7. Point the domain at Vercel

1. Vercel → Project → **Settings → Domains** → add `bigwavesslides.com` and
   `www.bigwavesslides.com`.
2. At your registrar, add the DNS records Vercel shows (an `A` record for the
   apex + `CNAME` for `www`, or Vercel nameservers).
3. If using `media.bigwavesslides.com`, add the Cloudflare R2 custom‑domain CNAME.
4. Wait for SSL to provision (usually minutes). Set the apex as primary.

---

## 8. First‑login & lock‑down

1. Go to **https://bigwavesslides.com/admin/login**.
2. Sign in with the seeded super‑admin:
   - **admin@bigwavesslides.com** / **BigWave!2026**
3. ⚠️ **Immediately** create a new admin user for yourself (Users → New admin
   user) with a strong password, then sign in as that user and deactivate or
   reset the seeded account. *(Changing the seed password requires a re‑seed or
   a DB update — easiest is to create your own and stop using the default.)*
4. In **Admin → Settings**, confirm contact email/phone/WhatsApp, hours, fees,
   and social links.

---

## 9. Connect optional channels

- **WhatsApp** (Meta → WhatsApp → Configuration):
  - Callback URL: `https://bigwavesslides.com/api/whatsapp/webhook`
  - Verify token: your `WHATSAPP_VERIFY_TOKEN`
  - Subscribe to the `messages` field. Add `WHATSAPP_TOKEN` (permanent token) and
    `WHATSAPP_PHONE_NUMBER_ID`.
- **Analytics**: paste your GA4 ID (`G-…`) and Clarity ID into the env vars and
  redeploy. Scripts load only when these are present.

---

## A. Copy‑paste environment variables (Vercel)

> Replace every `‹ ›` placeholder with your real value from the steps above.
> The non‑placeholder lines can be pasted as‑is.

```
NEXT_PUBLIC_SITE_URL=https://bigwavesslides.com
NEXTAUTH_URL=https://bigwavesslides.com
NEXTAUTH_SECRET=‹paste the openssl value›

DATABASE_URL=‹Neon POOLED connection string›
DIRECT_URL=‹Neon DIRECT connection string›

R2_ACCOUNT_ID=‹Cloudflare account id›
R2_ENDPOINT=https://‹account-id›.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=‹R2 access key id›
R2_SECRET_ACCESS_KEY=‹R2 secret access key›
R2_BUCKET_NAME=bigwaveslides
R2_PUBLIC_URL=https://media.bigwavesslides.com

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@bigwavesslides.com
SMTP_PASSWORD=‹mailbox password›
SMTP_FROM=Big Wave Slides <contact@bigwavesslides.com>

CRON_SECRET=‹paste the openssl value›

WHATSAPP_PHONE_NUMBER=‹digits only, e.g. 15551234567›
WHATSAPP_TOKEN=‹Meta permanent token, optional›
WHATSAPP_PHONE_NUMBER_ID=‹Meta phone number id, optional›
WHATSAPP_VERIFY_TOKEN=‹paste the openssl value, optional›

NEXT_PUBLIC_GA_ID=‹G-XXXXXXXXXX, optional›
NEXT_PUBLIC_CLARITY_ID=‹clarity id, optional›
```

> **Minimum to go live:** `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`,
> `NEXTAUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`. R2 + SMTP make media uploads
> and emails work. WhatsApp/analytics are optional and degrade gracefully.

---

## B. Pre‑launch checklist

- [ ] Production build succeeded on Vercel (green deploy)
- [ ] `prisma migrate deploy` + `db:seed` ran against Neon
- [ ] Domain resolves over HTTPS; `www` redirects to apex
- [ ] Home, Shop, Rent, Services, Events, Blog, Testimonials, Contact all render in EN **and** FR
- [ ] Submit a test **quote**, **order request**, and **booking** → confirmation email arrives at the customer + `contact@bigwavesslides.com`
- [ ] Sign the test booking's **contract** → status flips to SIGNED
- [ ] `/admin` requires login; confirm a booking → dates show as booked on that rental's calendar
- [ ] Created **your own admin user**; seeded default no longer used
- [ ] `https://bigwavesslides.com/sitemap.xml` and `/robots.txt` load
- [ ] `https://bigwavesslides.com/api/og` returns an image
- [ ] Replaced seed placeholder media/content with real assets (admin → Media/Products/Blog)
- [ ] Reviewed Privacy Policy & Terms with counsel
- [ ] (If used) WhatsApp webhook verified; GA4/Clarity receiving hits

---

## C. Operations

- **Abandoned‑cart sweep** runs hourly via Vercel Cron (`vercel.json`). Verify in
  Vercel → Project → **Cron Jobs**.
- **Backups**: enable Neon point‑in‑time restore.
- **Rotate** `NEXTAUTH_SECRET`/`CRON_SECRET` if ever exposed (re‑deploy after).
- **Logs**: Vercel → Deployments → Functions for server errors; Admin → Activity
  for the staff audit trail.

---

## D. Local development

```bash
cp .env.example .env.local      # fill in DATABASE_URL, DIRECT_URL at minimum
npm install
npm run db:migrate              # dev migrations
npm run db:seed
npm run dev                     # http://localhost:3000

npm run typecheck && npm run lint && npm run test   # quality gates
```
