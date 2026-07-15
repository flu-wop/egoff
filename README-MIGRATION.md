# EGOFF Essentials — Next.js Migration

Replaces the flat `index.html` site (still live at egoff.vercel.app / main
branch) with Next.js + Turso + Stripe + Resend. This branch (`migration-nextjs`)
should stay off `main` until everything below is done and tested in Stripe
test mode.

## 1. Account setup (do these first)

1. **Turso** → turso.tech → `turso db create egoff-orders` → `turso db show egoff-orders --url` and `turso db tokens create egoff-orders` for the URL/token.
2. **Stripe** → dashboard.stripe.com → Developers → API keys → copy secret + publishable keys. (Webhook secret comes in step 3, after deploy.)
3. **Resend** → resend.com → API Keys → create key. Domain verification can come later — `onboarding@resend.dev` works to start.

## 2. Local setup

```bash
cp .env.example .env.local
# fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, STRIPE_SECRET_KEY, RESEND_API_KEY, ADMIN_PASSWORD
npm install
npm run init-db     # creates orders + newsletter tables on the real Turso DB
npm run dev
```

## 3. Deploy + Stripe webhook

```bash
git add .
git commit -m "EGOFF Next.js migration — steps 1-9"
git branch -M migration-nextjs
git remote add origin https://flu-wop:[YOUR_TOKEN]@github.com/flu-wop/egoff.git
git push -u origin migration-nextjs
```

Then in Vercel: import the repo, deploy the `migration-nextjs` branch as a
**preview** (don't touch production settings yet). Add every env var from
`.env.example` in Vercel → Project → Settings → Environment Variables.

After first deploy:
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://<preview-url>/api/stripe/webhook`
3. Event: `checkout.session.completed`
4. Copy the signing secret (`whsec_...`) → add as `STRIPE_WEBHOOK_SECRET` in Vercel → redeploy

## 4. Test in Stripe test mode before going live

Use Stripe's test card `4242 4242 4242 4242`, any future expiry/CVC. Confirm:
- Order appears in `/admin/orders` (log in with `ADMIN_PASSWORD`)
- Customer + owner confirmation emails arrive (check spam while using `onboarding@resend.dev`)
- Cart clears only after real redirect to `/checkout/success`
- Canceling checkout returns to `/` with cart intact

## 5. Go live

1. Switch Stripe dashboard from test mode to live mode, get live keys, update Vercel env vars
2. Add a **second** Stripe webhook endpoint for live mode (same URL, live signing secret)
3. Merge `migration-nextjs` → `main` — this is the point the old flat-HTML mailto flow goes away for real customers
4. Keep the old `index.html` git history around; don't delete it, just stop deploying it

## Known open items (not blocking, but real)

- **FAQ copy** still describes the old "Ericka confirms and arranges payment" flow. Now checkout charges immediately via Stripe. Needs Ericka's updated wording before this goes live — see the flagged note from the migration session.
- 6 seasonal products have no photos/pricing yet — correctly excluded from `lib/products.ts` and marked "Coming Soon" on the site.
- `RESEND_FROM_EMAIL` stays `onboarding@resend.dev` until EGOFF's sending domain is verified in Resend.
