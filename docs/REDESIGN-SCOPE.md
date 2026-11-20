# EGOFF Essentials — Storefront Rebuild Scope (preview branch)

Branch: `redesign-preview` — never merges to `main` until Ericka approves the preview URL.

## Goal
Make the shop the star. Faster path from landing to "Add to cart" to checkout, a calmer mobile experience, and a codebase that is easy to change (today the whole page is one 1,300-line HTML string in `app/body-content.ts`).

## What does NOT change (protected)
- `/api/*` routes, server-side pricing (`lib/products.ts`), shipping/tax logic, Square payment links and webhook, Zelle option, Resend emails.
- `/admin/*` (orders, Mark Paid, Resend Notification, System Health).
- Brand: emerald / gold / cream, Cormorant + Cinzel + Lato, the tree logo, Ericka's words and family tree content.

## What changes
1. **Page structure (shop first)**
   Hero (shorter) → Shop strip (category tabs: Specialty / Body Butter / Pump / Regular / Seasonal) → Story → Roots/Tree → Testimonials → Foundation → FAQ → Contact.
2. **Product cards**: bigger photo, scent name, one-line benefit, price, clear Add button; details open in a quick-view drawer instead of long card text.
3. **Cart + checkout**: sticky cart, free-shipping progress bar ("$X away from free shipping"), Zelle/Square choice explained up front, order summary identical to server pricing.
4. **Story**: short version on the page, full story behind "Read more" (already started on mobile).
5. **Mobile-first pass**: 390px layouts, tap targets, sticky "Shop" button.
6. **Componentization**: break the HTML string into React components (`Hero`, `ShopGrid`, `ProductCard`, `Cart`, `Checkout`, `Story`, `Tree`, `Testimonials`, `Foundation`, `Faq`, `Contact`, `Footer`) with product data in one typed catalog file.

## Phases
| Phase | Work | Output |
|---|---|---|
| 0 | Branch + Vercel preview + preview-safe env (see risks) | Preview URL |
| 1 | Component skeleton, catalog file, parity with today's page | Looks the same, code is clean |
| 2 | Shop-first layout, product cards, quick view | Core redesign |
| 3 | Cart/checkout polish, shipping progress bar | Conversion work |
| 4 | Mobile pass, accessibility, performance (image sizing, Lighthouse) | QA'd |
| 5 | Ericka review → fixes → merge PR to `main` | Live |

Rough effort: Phases 0–2 about one focused session, 3–4 about one more, review rounds depend on Ericka.

## Risks / rules
- **Preview must not take real orders.** Preview env uses Square sandbox (or checkout disabled with a "preview only" banner) and a throwaway Turso DB. Production env vars are not exposed to Preview.
- **Cart parity.** Cart/checkout is the money path; every phase re-tests: add item, pump scent, shipping under/over $75, submit order, admin sees it.
- **Health-claim copy** (migraines/anxiety, pain relief, mosquito repellent, eczema) conflicts with the FDA disclaimer. Not changed by us; flag to Ericka before launch.
- **Product photos** are uneven; the new cards will expose weak ones. Ask Ericka for consistent photos.
- **Facebook link** still pending from Ericka.

## Decisions needed from James
1. OK to move to React components (recommended) or keep the single HTML string and only restyle?
2. Preview payments: Square sandbox, or checkout disabled on preview?
3. Show Ericka a look-only mockup first, or go straight to the live preview URL?
4. Keep the family tree prominent, or move it to its own "Our Roots" page?
