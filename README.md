# SETVA — setvawards.com

Modern website for the **Southeast Texas Visionary Awards (SETVA)** with:

- **Ticket sales** (Square Checkout payment links)
- **Donations** (custom or preset amounts)
- **Sponsor packages** (online purchase + custom inquiry flow)
- Vendor and contact pages

Built with [Next.js](https://nextjs.org), TypeScript, and Tailwind CSS. Payments run through **[Square](https://squareup.com)** on the backend.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add your Square and Resend credentials to .env.local
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

HQ dashboards and pipelines show **only real submissions**. Empty states appear when there is no data yet. Do not add mock or sample records to production UI.

## Square setup

1. Create an app at [Square Developer Dashboard](https://developer.squareup.com/apps).
2. Use **Sandbox** credentials while testing locally.
3. Copy your **Access Token** and **Location ID** into `.env.local`:

```env
SQUARE_ACCESS_TOKEN=EAAA...
SQUARE_LOCATION_ID=L...
SQUARE_ENVIRONMENT=sandbox
SQUARE_SUPPORT_EMAIL=setvaawards@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. For production, switch to production credentials and set `SQUARE_ENVIRONMENT=production` and `NEXT_PUBLIC_SITE_URL=https://setvawards.com`.

**Connect your SETVA Square account for live sponsor payments:**

1. Log in at [squareup.com/dashboard](https://squareup.com/dashboard) with the SETVA business account.
2. In [Developer Dashboard](https://developer.squareup.com/apps) → your app → **Credentials** → copy the **Production** access token.
3. Go to **Locations** in Square Dashboard → copy the **Location ID** for Jefferson Theater / SETVA events location.
4. Add both to `.env.local` and **Vercel → Environment Variables** (Production).
5. Set `SQUARE_ENVIRONMENT=production` on Vercel.
6. Test a small package in sandbox first, then a real purchase in production.

Every priced sponsor card on `/sponsors` has a **Buy** button that creates a Square-hosted checkout page. Funds deposit to your connected Square account.

### Webhooks (optional)

Register `https://your-domain.com/api/webhooks/square` in the Square dashboard and set `SQUARE_WEBHOOK_SIGNATURE_KEY` to verify payment events server-side.

Ticket tiers, sponsor packages, and donation presets are defined in `src/lib/site.ts`.

## Sponsor deck email funnel

The `/sponsors` page includes a form that emails the **Torch of Excellence** sponsorship deck PDF to requesters.

1. Place the deck PDF at `private/sponsor-deck/setva-2026-torch-of-excellence.pdf`.
2. Create a [Resend](https://resend.com) API key and add `RESEND_API_KEY` to `.env.local`.
3. Set `SPONSOR_DECK_FROM_EMAIL` to your verified sender (e.g. `SETVA <sponsors@setvawards.com>`).
4. Set `SPONSOR_DECK_ACCESS_SECRET` to a long random string (same value on Vercel).

Requesters receive a branded email with **View Sponsorship Deck** — a private link to `/sponsors/deck` (not listed in site navigation). The PDF is served only with a valid signed access token.

## GitHub

Repository: [github.com/vaughnxmedia-alt/SETVA](https://github.com/vaughnxmedia-alt/SETVA)

```bash
git push origin main
```

## Deploy on Vercel

1. Import [vaughnxmedia-alt/SETVA](https://github.com/vaughnxmedia-alt/SETVA) in the [Vercel dashboard](https://vercel.com/new) (or use the linked CLI project).
2. Add **Environment Variables** for Production (and Preview if you want):

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://setvawards.com` |
| `SQUARE_ACCESS_TOKEN` | production token |
| `SQUARE_LOCATION_ID` | location ID |
| `SQUARE_ENVIRONMENT` | `production` |
| `RESEND_API_KEY` | `re_...` |
| `SPONSOR_DECK_FROM_EMAIL` | `SETVA <sponsors@setvawards.com>` |
| `SPONSOR_DECK_NOTIFY_EMAIL` | your team inbox |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `HEADQUARTERS_ADMIN_SIGNUP_PASSWORD` | one-time team signup code (default: `Visionary2526`) |
| `HEADQUARTERS_SESSION_SECRET` | long random string for HQ login cookies |
| `HEADQUARTERS_TEAM_FROM_EMAIL` | `SETVA <sponsors@setvawards.com>` |

3. **Custom domain** — in Vercel → Project → Settings → Domains, add `setvawards.com` and `www.setvawards.com`. Vercel shows the DNS records to add at your registrar (or in Microsoft 365 DNS if that is where the domain is managed).

## Headquarters (live site)

Headquarters at `/headquarters` needs **Supabase** and **session** env vars on Vercel Production. Without them, signup fails with storage errors and saved nominee video/image imports cannot persist.

1. Copy `.env.example` to `.env.local` for local development.
2. In **Vercel → Project → Settings → Environment Variables** (Production), set at minimum:
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - `HEADQUARTERS_SESSION_SECRET` (any long random string)
   - `HEADQUARTERS_ADMIN_SIGNUP_PASSWORD` (team code for **Create account** — use `Visionary2526` or your own value)
   - `NEXT_PUBLIC_SITE_URL=https://setvawards.com`
   - `RESEND_API_KEY` (optional; welcome emails after signup)
3. **Redeploy** after changing env vars (Vercel → Deployments → Redeploy).
4. **Seed your admin account** once Supabase is connected (from your machine with `.env.local` filled in):

```bash
npx tsx scripts/migrate-hq-team.ts --send-email
```

Then sign in at `/headquarters/login` with that email and password. New teammates use **Create account** with the team access code; they do not need the code when signing in later.

Nominee videos and graphics import from **Headquarters → Nominees** or **Categories** (Nomination Media Import). Files are saved under `public/nominations/` and metadata in Supabase.

## Resend + Microsoft 365 email

The site sends sponsor-deck emails through **Resend’s API** (not Outlook SMTP). Your Microsoft 365 mailbox is the **From address** visitors see; Resend delivers the message after your domain is verified.

### 1. Create the sender mailbox (Microsoft 365)

In [Microsoft 365 Admin](https://admin.microsoft.com) → **Users** → add or use a mailbox such as `sponsors@setvawards.com` (or an alias on an existing user).

### 2. Add the domain in Resend

1. [Resend → Domains](https://resend.com/domains) → **Add domain**.
2. Prefer a subdomain for sending reputation, e.g. `send.setvawards.com`, **or** use the root `setvawards.com` if you want `sponsors@setvawards.com` directly.
3. Resend shows **SPF**, **DKIM**, and optional **DMARC** DNS records.

### 3. Publish DNS in Microsoft 365

If your domain DNS is managed in Microsoft 365:

1. [admin.microsoft.com](https://admin.microsoft.com) → **Settings** → **Domains** → select your domain → **DNS records**.
2. Add each record Resend provides (TXT for SPF/DKIM, etc.).
3. **Important — one SPF record only.** If you already have Microsoft 365 SPF, **merge** instead of adding a second record:

```txt
v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all
```

(`include:amazonses.com` is what Resend uses; confirm the exact value shown in your Resend dashboard.)

4. Enable **DKIM** for Microsoft 365 in [Defender → Email authentication → DKIM](https://security.microsoft.com/authentication) (separate from Resend’s DKIM records — both can coexist on different hostnames).
5. Back in Resend, click **Verify DNS records**. Propagation can take up to 48 hours.

### 4. Configure the app

```env
RESEND_API_KEY=re_xxxxxxxx
SPONSOR_DECK_FROM_EMAIL=SETVA <sponsors@setvawards.com>
SPONSOR_DECK_NOTIFY_EMAIL=sponsors@setvawards.com
NEXT_PUBLIC_SITE_URL=https://setvawards.com
```

Set the same values in **Vercel → Environment Variables**. Replies from recipients go to `setvaawards@gmail.com` via the `replyTo` field in code unless you change it in `src/lib/email.ts`.

## Project structure

```
src/
  app/
    api/checkout/       # Creates Square payment links
    api/webhooks/square # Payment notifications (stub)
  lib/
    site.ts             # Copy, pricing, packages
    square.ts           # Square client & payment links
    checkout-items.ts   # Maps cart items → Square line items
```

## Contact

- setvaawards@gmail.com
- 318-592-1768
