# ClearLedger

Free finance calculators + SEO guides (ad-supported) with a Pro subscription (saved budgets, bill reminders, CSV export, no ads).

Next.js 16 (App Router) · Postgres + Drizzle · Better Auth · Lemon Squeezy · Resend · Google AdSense.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.
npm run db:push              # create tables
npm run dev
```

Scripts: `npm test` (calculator unit tests), `npm run typecheck`, `npm run build`.

## How the pieces fit

| Area | Where |
|---|---|
| Money math (integer cents) | `src/lib/currency.ts`, `src/lib/calculators/*` |
| Plan limits (free vs pro) | `src/lib/plans.ts`, enforced server-side in `src/actions/*` |
| Current user + plan | `src/lib/viewer.ts` (`getViewer`, `requireViewer`) |
| Premium article split | `src/lib/mdx.ts` — body after `{/* PAYWALL_BREAK */}` never leaves the server for non-Pro |
| Ads | `src/components/ads/*`; loaded only in `(public)` layout, never under `/dashboard`, never for Pro |
| Billing | `createCheckoutAction` → Lemon Squeezy checkout → `/api/webhooks/billing` sets `users.plan` |
| Reminders | `/api/cron/bill-reminders` (Vercel cron in `vercel.json`, needs `Authorization: Bearer $CRON_SECRET`) |

## Launch runbook

1. Create a Postgres DB (e.g. Neon), set `DATABASE_URL`, run `npm run db:push`.
2. Set `BETTER_AUTH_SECRET` (32+ random chars) and `BETTER_AUTH_URL`.
3. Lemon Squeezy: create a store + monthly/annual subscription variants, set the `LEMONSQUEEZY_*` vars, and point a webhook at `/api/webhooks/billing` for `subscription_created|updated|cancelled|resumed|expired` using `BILLING_WEBHOOK_SECRET`.
4. Resend: set `RESEND_API_KEY` and a verified `EMAIL_FROM`.
5. Set `CRON_SECRET` on Vercel (Vercel sends it as the bearer token).
6. Add `public/og-default.png`, replace the template legal pages, submit `/sitemap.xml`, then apply for AdSense and fill `NEXT_PUBLIC_ADSENSE_CLIENT_ID` + slot IDs.

## QA checklist

- [ ] `$1,234.56` stores as `123456` and formats back (covered by `npm test`)
- [ ] Free user over 1 budget / 3 bills gets `UPGRADE_REQUIRED`
- [ ] View source of a premium post logged out: nothing after the paywall marker
- [ ] Pro user: no `adsbygoogle` script or `<ins>` anywhere
- [ ] Replaying a webhook returns `200` with `duplicate: true`
- [ ] `/api/cron/bill-reminders` without the bearer token returns `401`
