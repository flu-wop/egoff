# EGOFF Essentials — Next.js Migration

Replaces the flat `index.html` site (still live at egoff.vercel.app / main
branch) with Next.js + Turso + Stripe + Resend. This branch (`migration-nextjs`)
should stay off `main` until everything below is done and tested in Stripe
test mode.

## How checkout actually works

This is **not** immediate-payment checkout. By design (Ericka's call):

1. Customer submits an order request — no card collected, nothing charged.
2. Order saves to Turso as `pending_review`. Ericka gets an email; customer gets a "we received your request" email.
3. Ericka reviews `/admin/orders`, confirms she can fulfill it, clicks **Send Payment Link**.
4. That creates a real Stripe Payment Link (no forced expiry, unlike a plain Checkout Session) and emails it to the customer. Order status → `awaiting_payment`.
5. Customer pays via the link. Stripe fires `checkout.session.completed` → webhook flips the order to `paid` and sends the final confirmation emails.

This matches the original site's FAQ copy ("Ericka will confirm availability and arrange payment") exactly — no copy change needed there.


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
- Order appears in `/admin/orders` as `PENDING REVIEW` after a test submission
- Customer + owner "order request received" emails arrive
- Clicking **Send Payment Link** flips status to `AWAITING PAYMENT` and emails the customer a real Stripe link
- Paying via that link flips status to `PAID` and fires the final confirmation emails
- Retrying a webhook delivery (or resending the same test payment) doesn't duplicate the order or the emails

## 5. Go live

1. Switch Stripe dashboard from test mode to live mode, get live keys, update Vercel env vars
2. Add a **second** Stripe webhook endpoint for live mode (same URL, live signing secret)
3. Merge `migration-nextjs` → `main`
4. Keep the old `index.html` git history around; don't delete it, just stop deploying it

## Known open items (not blocking, but real)

- 6 seasonal products have no photos/pricing yet — correctly excluded from `lib/products.ts` and marked "Coming Soon" on the site.
- `RESEND_FROM_EMAIL` stays `onboarding@resend.dev` until EGOFF's sending domain is verified in Resend.
- Payment Links created by `/admin/orders` don't expire automatically — if an order goes stale (customer never pays), there's no automatic cleanup/reminder yet.
