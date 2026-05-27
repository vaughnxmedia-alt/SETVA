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
# Add your Square credentials to .env.local (or skip for demo mode)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — no domain required.

### Preview mode (default)

- All prices, venue, schedule, and nominees are **sample data** in `src/lib/site.ts`.
- Without Square credentials, checkout buttons run a **demo flow** and land on `/thank-you?demo=1`.
- A yellow banner reminds visitors that numbers aren’t final yet.

Set `usingPlaceholderData = false` in `site.ts` when you go live with real info.

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

### Webhooks (optional)

Register `https://your-domain.com/api/webhooks/square` in the Square dashboard and set `SQUARE_WEBHOOK_SIGNATURE_KEY` to verify payment events server-side.

Ticket tiers, sponsor packages, and donation presets are defined in `src/lib/site.ts`.

## Deploy

Recommended: [Vercel](https://vercel.com) — connect this repo, add env vars, point `setvawards.com` DNS when ready.

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
