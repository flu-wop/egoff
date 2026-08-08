# EGOFF Essentials — Next.js Migration

Replaces the flat `index.html` site (formerly live at egoff.vercel.app) with
Next.js + Turso + Square + Resend. This has been merged to `main`.

## How checkout actually works

This is **not** immediate-payment checkout. By design (Ericka's call):

1. Customer submits an order request — no card collected, nothing charged.
2. Order saves to Turso as `pending_review`. Ericka gets an email; customer gets a "we received your request" email.
3. Ericka reviews `/admin/orders`, confirms she can fulfill it, clicks **Send Payment Link**.
4. That creates a real Square Payment Link (a Square Order + hosted checkout page) and emails it to the customer. Order status → `awaiting_payment`.
5. Customer pays via the link. Square fires `payment.updated` (status `COMPLETED`) → webhook flips the order to `paid` and sends the final confirmation emails.

This matches the original site's FAQ copy ("Ericka will confirm availability and arrange payment") exactly — no copy change needed there.

**Reconciliation note:** the `orders.stripe_session_id` column kept its
original name (small diff, one less migration) but now holds the **Square
Order ID** returned when the Payment Link is created. The webhook matches
incoming payments back to an order via that column, not the column name.

## 1. Account setup (do these first)

1. **Turso** → turso.tech → `turso db create egoff-orders` → `turso db show egoff-orders --url` and `turso db tokens create egoff-orders` for the URL/token.
2. **Square** → developer.squareup.com → create an application → Sandbox tab for testing → copy the Sandbox Access Token and a Location ID. Production credentials come later, once testing is done.
3. **Resend** → resend.com → API Keys → create key. Domain verification can come later — `onboarding@resend.dev` works to start.

## 2. Local setup

```bash
cp .env.example .env.local
# fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, SQUARE_ACCESS_TOKEN,
# SQUARE_LOCATION_ID, RESEND_API_KEY, ADMIN_PASSWORD
npm install
npm run init-db     # creates orders + newsletter tables on the real Turso DB
npm run dev
```

## 3. Deploy + Square webhook

```bash
git add .
git commit -m "Swap payment integration from Stripe to Square"
git push
```

Vercel auto-deploys on push to `main`. Add every env var from
`.env.example` in Vercel → Project → Settings → Environment Variables,
then redeploy (env changes don't apply to an already-running build).

After first deploy:
1. Square Developer Dashboard → your app → Webhooks → Add Endpoint
2. URL: `https://<your-domain>/api/square/webhook`
3. Events: `payment.created`, `payment.updated`
4. Copy the Signature Key → add as `SQUARE_WEBHOOK_SIGNATURE_KEY` in Vercel → redeploy

## 4. Test in Square Sandbox before going live

Use a Square Sandbox test card (Square's dashboard gives you one). Confirm:
- Order appears in `/admin/orders` as `PENDING REVIEW` after a test submission
- Customer + owner "order request received" emails arrive
- Clicking **Send Payment Link** flips status to `AWAITING PAYMENT` and emails the customer a real Square link
- Paying via that link flips status to `PAID` and fires the final confirmation emails
- Retrying a webhook delivery (or resending the same test payment) doesn't duplicate the order or the emails

## 5. Go live

1. Create the production credentials in the same Square app (or a live Square app), set `SQUARE_ENVIRONMENT=production`, update Vercel env vars with the live `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID`
2. Add a **second** Square webhook subscription for production (same URL, its own signature key) if Square separates sandbox/production subscriptions on your app
3. Confirm a real low-dollar test order end-to-end before telling Ericka it's live

## Known open items (not blocking, but real)

- 6 seasonal products have no photos/pricing yet — correctly excluded from `lib/products.ts` and marked "Coming Soon" on the site.
- `RESEND_FROM_EMAIL` stays `onboarding@resend.dev` until EGOFF's sending domain is verified in Resend.
- Payment Links created by `/admin/orders` don't expire automatically — if an order goes stale (customer never pays), there's no automatic cleanup/reminder yet.
- This Square integration hasn't been run end-to-end against a real Sandbox account yet — do the full test pass in section 4 before flipping to production.
