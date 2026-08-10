# Security & bot protection

The goal: **block bad bots and attackers without hurting real visitors or SEO.**
You can't just "block bots" — Googlebot and Bingbot are bots, and blocking them
removes you from search (which *is* losing visibility). So protection is layered:
allow good crawlers, block bad ones, never touch humans.

## Layer 1 — The edge (Cloudflare) — your real bot/DDoS shield

This is ~90% of real protection and it auto-allows verified search crawlers, so
SEO is safe. It can't be done in app code — it's a DNS change.

1. Create a free account at **cloudflare.com** and add your domain.
2. Update your domain's **nameservers** at your registrar to Cloudflare's.
3. In the Cloudflare dashboard:
   - **SSL/TLS → Overview**: set to **Full (strict)**.
   - **Security → Bots**: enable **Bot Fight Mode** (free) — challenges automated
     traffic while letting verified crawlers (Google/Bing) through.
   - **Security → WAF**: turn on the **Managed Ruleset** (free tier includes core
     protections against common exploits).
   - **Security → Settings**: set Security Level to *Medium*; enable
     **Browser Integrity Check**.
   - **Rules → Rate limiting**: add a rule, e.g. limit `/admin/*` and `/api/*` to
     ~20 requests/min per IP.
   - (Optional) **Rules → WAF custom rule**: *Block* requests where
     "Known Bots" is off AND path contains `/admin` — keeps crawlers off admin.
4. Leave the **orange cloud (proxy) ON** for the root + www records.

If you deploy on **Vercel**, you can alternatively/additionally enable **Vercel
WAF + Bot Management** and **Attack Challenge Mode** from the project dashboard.

## Layer 2 — App hardening (already in the codebase)

- **Security headers** (`next.config.ts`): HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Powered-By` removed.
- **Content-Security-Policy** is shipped in **Report-Only** mode (logs violations,
  blocks nothing). Watch your browser console / a report endpoint in production,
  fix any legit violations, then rename the header from
  `Content-Security-Policy-Report-Only` to `Content-Security-Policy` to enforce.
- **Rate limiting** (`lib/rate-limit.ts`) on the admin login (8 / 15 min / IP),
  the contact form (5 / 10 min) and order requests (6 / 10 min).
  - **Production upgrade:** the default limiter is in-memory (per serverless
    instance). For correct global limits, create a free **Upstash Redis** DB and
    set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in your env — the
    limiter picks them up automatically. (`@upstash/ratelimit` is installed.)
- **Honeypot fields** on public forms (bots fill them; humans never see them).
- **Zod validation** at every input boundary; **Prisma** parameterizes all SQL.
- `robots.ts` disallows `/admin`, `/api`, `/cart`, `/checkout`; admin pages are
  `noindex`.
- **Analytics** excludes `BOT` traffic from the dashboard and visitor list by
  default (toggle "Show bots" on the Visitors page).

## Layer 3 — Admin lockdown

1. **Change the seeded default password immediately** (it's public in the repo):
   ```bash
   npm run admin:set-password -- admin@bigwavesslides.com "<a-strong-password>"
   ```
   Then clear your shell history.
2. Keep admin accounts to the minimum; deactivate ones you don't use (Users page).
3. (Optional, advanced) Restrict `/admin` to known IPs at the edge — add a
   Cloudflare WAF rule: *Block* when path starts with `/admin` and IP is not in
   your office/home list. Don't hard-code IP blocks in the app (lockout risk).
4. Consider adding 2FA to admin login as a future enhancement.

## Quick checklist
- [ ] Domain proxied through Cloudflare, Bot Fight Mode + WAF on
- [ ] Default admin password rotated
- [ ] Upstash env vars set (production rate limiting)
- [ ] CSP report-only reviewed, then enforced
- [ ] Admin rate limiting + headers verified in prod response
