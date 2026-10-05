# Backend Progress — Cindyrella

Summary of what's been built so far, following `BACKEND_ROADMAP.md`. Last updated 2026-10-03.

## Status

| Phase | Status |
|---|---|
| 0 — Environment & skeleton | Done |
| 1 — Database schema | Done (Studio row-insert check not yet run) |
| 2 — Auth | Done (backend curl-tested; frontend not yet clicked through in a browser) |
| 3 — Products & single source of truth | Done (API curl-tested; admin and storefront screens not yet clicked through in a browser) |
| 4 — Cart & atomic checkout | Done (API curl-tested; cart, purchases and admin orders screens not yet clicked through in a browser) |
| 5 — Payments (manual: customer uploads a transfer screenshot, admin verifies it) | Built; API curl-tested end to end. Not clicked through in a browser |
| 6 — Audit trails | Done for orders and products; staff and CMS content have no backend yet (see below). Admin order screen not yet clicked through in a browser |
| 7 — CMS, reviews, forms, uploads | Built; backend curl-tested (email via a local SMTP sink, uploads signature checked). Not tried against a real Cloudinary account or in a browser |
| 8 — Hardening | Built; every backend piece curl-tested (see below). Not clicked through in a browser |

## Phase 0 — what exists

- **Postgres 16** in Docker: container `cindyrella-db`, password `devpassword`, port 5432, database `cindyrella`.
- **`backend/`** (Express 5 + TypeScript, run with `tsx`):
  - `src/index.ts` starts the server on `PORT` (4000).
  - `src/app.ts` has CORS (`FRONTEND_ORIGIN`, credentials on), JSON parsing, cookie-parser and `GET /health` returning `{ ok: true }`.
  - `src/lib/prisma.ts` is the PrismaClient singleton (uses the `@prisma/adapter-pg` driver adapter).
  - The rest of the roadmap tree (routes, controllers, services, middleware, `lib/jwt.ts`) is one-line `TODO(Phase N)` stubs. No routes are mounted yet.
- **All roadmap dependencies are installed up front**, so later phases need no installs.
- **Scripts:** `npm run dev`, `npm run build`, `npm run typecheck`.
- **Env:** `backend/.env` (gitignored) and `backend/.env.example` hold `PORT`, `DATABASE_URL`, `FRONTEND_ORIGIN` and a placeholder `JWT_SECRET`. Change the secret before Phase 2.
- **Frontend:** `frontend/.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:4000`. `frontend/library/api/client.ts` is a fetch wrapper (`credentials: 'include'`, throws `ApiError`). The other `library/api/*.ts` files are stubs.

## Phase 1 — schema (`backend/prisma/schema.prisma`)

Migration `init` is applied. The 11 tables are `Customer`, `StaffMember`, `Address`, `Product`, `ProductSize`, `StockMovement`, `Order`, `OrderItem`, `Review`, `Voucher` and `ContentSection`.

Design decisions:
- **Money** is whole pesos in `Int` columns, matching the frontend.
- **Stock:** `Product.stock` is used only for products without sizes; otherwise stock is on `ProductSize`. Both have an optional `reorderThreshold`.
- **`StockMovement`** is append-only, with a signed `quantity` and a `reason` enum (RESTOCK, CORRECTION, DAMAGED, EXPIRED, SALE, RETURN, IMPORT). It links optionally to the staff member and the order.
- **`Order`** snapshots the shipping name, email and address. `OrderItem` snapshots the product name and unit price. Statuses are PENDING, PAID, SHIPPED, DELIVERED and CANCELLED; customer-facing labels ("To Ship" etc.) are derived from them.
- **`Review`** allows one per customer per product.
- **`ContentSection`** is one JSON row per CMS section key.
- **Not modelled yet:** password-reset one-time codes (Phase 2) and audit-log tables (Phase 6).

## Gotchas hit along the way

- **Prisma version:** pinned to **7.10.0** (`prisma` and `@prisma/client`). npm's `latest` tag is an 8.0 release candidate whose `init` behaves differently and added unwanted files. Do not upgrade `prisma` casually.
- **Prisma 7 differences from the roadmap:**
  - It needs a driver adapter (`@prisma/adapter-pg`, installed).
  - It needs a `prisma.config.ts`, because the datasource URL lives there, not in `schema.prisma`.
  - The generated client is in `src/generated/prisma` (gitignored). Import it from there, not from `@prisma/client`.
- **TypeScript 6** needs `module` and `moduleResolution` set to `NodeNext`. The old `Node` setting errors.

## Leftover cleanup (safe to delete manually)

A release-candidate `prisma init` left these in `backend/`: `.agents/`, `.claude/`, `.cursor/`, `.devin/`, `.env.bak` and a duplicate `prisma7.config.ts`. Prisma currently reads `prisma7.config.ts` (it has the same settings as `prisma.config.ts`), so deleting either one is safe.

## Not yet verified

- The Phase 1 "Done when" check: `npx prisma studio` and one manual row per table.
- Postgres has no backup. Data is lost if the container is removed.

## Phase 2 — auth

**Backend** (`/auth`, mounted in `app.ts`):
- `POST customer/register`, `customer/login`, `customer/logout`, `GET customer/session`.
- `POST customer/otp/request` and `customer/otp/verify` (reset password with a 6-digit code). Only a SHA-256 hash of the code is stored (new `OtpCode` table). Codes last 10 minutes, allow 5 wrong attempts and are single-use. The request endpoint answers the same whether or not the email exists. Until Phase 7 email exists, the code is printed to the API console in non-production.
- `POST admin/login`, `admin/logout`, `GET admin/session`. The roadmap's single `GET /auth/session` is split into two, one per cookie.
- JWT in httpOnly, SameSite=Lax cookies: `customer_token` and `admin_token`, 7-day expiry, `secure` in production. A token's `kind` is checked, so a customer cookie can't open admin routes.
- `requireStaff` re-reads the staff row from the DB on every request, so role changes and deletions apply immediately. `requireRole(...)` (rbac.ts) returns 403.
- Passwords are hashed with bcrypt (12 rounds). Login runs a dummy compare for unknown emails, so timing doesn't reveal which emails exist.
- Test accounts, created with `npm run create-staff -- <email> <password> <name> [ADMINISTRATOR|STAFF]`: `admin@cindyrella.test` / `AdminPass123` (administrator) and `staff@cindyrella.test` / `StaffPass123` (staff). Delete or change these before any real deployment.
- Checked with curl: 401 for bad password, no cookie, tampered token and a customer cookie on an admin route; STAFF gets 403 and ADMINISTRATOR gets 200 on an admin-only route; the OTP flow works end to end, and a used code is rejected.

**Frontend** (`library/api/auth.ts` is the client):
- `store.tsx`: sign-in state comes from `GET customer/session` on mount. Auth fields are no longer saved in localStorage. `signIn` now takes `{name, email}`.
- `LoginModal.tsx`: real register and login, errors shown as toasts, and the forgot-password flow now has a new-password field. The Google button shows "isn't available yet", because the old fake sign-in no longer works.
- `adminStore.tsx` and `LoginForm.tsx`: real login, with the server session as the source of truth. `login()` now returns an error message or null. The fake localStorage and cookie mirroring is gone. The role shown in the UI comes from the real account.
- `proxy.ts`: asks the API `GET admin/session` for each `/admin/*` request. It fails closed if the API is down. Checked against the dev server: no cookie and forged cookies redirect to login, and a real session passes.

**Known gaps / notes**
- Not yet clicked through in a browser: customer sign-up and sign-in, forgot-password, and admin login and logout.
- Cookies work across :3000 and :4000 in development because cookies ignore ports. In production the site and API need a shared parent domain.
- No rate limiting on login or OTP yet (Phase 8).
- The `prisma generate` step is now a `postinstall` script, because `migrate dev` does not regenerate the client in Prisma 7.

## Phase 3 — products

**Backend** (`/products`):
- Public: `GET /` and `GET /:id`. They omit staff-only fields (reorder threshold, expiry).
- Staff only: `GET /admin` (full list), `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/stock-adjustment`, `GET /stock-log` (all products), `GET /:id/stock-log`, `GET /export.csv` and `POST /import` (multipart field `file`; same columns as the admin UI).
- Stock changes only through `services/stock.service.ts` (`adjustStockTx`). The decrement is one conditional UPDATE inside a transaction, and it writes a `StockMovement` in the same transaction. Verified: two concurrent `-4` on a stock of 5 gave one 200 and one 409. Phase 4 checkout should call `adjustStockTx` with its own transaction.
- `PATCH` never touches stock. Every adjustment needs a reason (RESTOCK, CORRECTION, DAMAGED, EXPIRED, RETURN; SALE and IMPORT are system-only). This replaces the old guess-from-diff behaviour.
- Responses derive `price` (cheapest size) and `stock` (sum of sizes) for products with sizes.
- Validation uses zod. Images must be a path or http(s) URL, and base64 is rejected. Deleting a product with orders returns 409. Lists and logs are paginated (page size at most 100).
- Schema additions: `Product.rating` and `ratingCount`, denormalized; Phase 7 should update them when a review is created.
- Seed: `npm run seed-products` loads the 24 mock products from `prisma/seed-products.json` with their original ids. It is idempotent and never overwrites live stock. Images were copied to `frontend/public/products/`.

**Frontend**:
- `library/products.ts` no longer holds mock data. `PRODUCTS` is a live binding filled by `ProductsProvider` (`library/productsStore.tsx`).
- The root layout fetches the catalogue on the server (revalidates every 30 seconds) and passes it to the provider, so the first paint and the SEO metadata use real data. The browser refetches on load. The first request after the 30-second window can still get the stale copy.
- `useStore()` and `useAdminStore()` expose `catalogVersion`, so existing components re-render when the catalogue changes without being edited individually.
- `library/api/products.ts` has the fetchers and the mappers from the API shape to the existing `Product` and `AdminProduct` types.
- `adminStore.tsx`: the product actions now call the API and then reload. `addProduct` and `updateProduct` resolve to true or false. The stock log comes from the server. The mock `library/admin/stockLog.ts` is no longer used.
- `ProductModal.tsx`: editing stock shows a "Reason for stock change" select (it defaults to Restock for an increase and Correction for a decrease). The form stays open if saving fails.
- `sitemap.ts` and `shop/[id]/layout.tsx` fetch from the API.

**Known gaps / notes**
- **Photo upload:** product photo upload is not saved, because the backend rejects base64 images. The UI shows "Photo not saved" until Phase 7 (Cloudinary).
- **Browser checks:** not yet done for inventory add, edit and delete, the CSV import, the stock-reason select, and the storefront shop, product and cart pages.
- **Old carts:** carts saved in localStorage hold the old string size ids, so old carts with sized products may drop those lines.
- **Mock data:** replaced by real data in the later "Mock data removal" section.
- **Phase 8:** the optimistic-concurrency `version` check on product edits is not implemented yet.

## Phase 4 — cart and checkout

**Backend:**
- `POST /cart/check` (public) reports price and availability per line without changing anything.
- `POST /orders` (customer) takes `{items: [{productId, sizeId, qty}], address}`. In ONE transaction it prices the lines from the database (the client sends no prices), creates the order, and takes the stock through `adjustStockTx` (reason SALE). If any line is short, the whole transaction rolls back and the response is a 409 naming the item.
- Order numbers are `LM-<1000+id>`.
- `GET /orders` (own orders) and `GET /orders/admin` (staff, optional `?status=`) are paginated.
- `POST /orders/:no/cancel` (customer, own order, only while PENDING).
- `PATCH /orders/:no/status` (staff). Allowed moves: PENDING to PAID or CANCELLED, PAID to SHIPPED or CANCELLED, SHIPPED to DELIVERED. DELIVERED and CANCELLED are final. The roadmap says `:id`; I used the order number.
- **Cancellation rule (decided):** stock is taken when the order is placed, and returned (reason RETURN) when an order is cancelled while PENDING or PAID. Status changes are conditional UPDATEs, so a double-cancel can't restock twice.
- **Phase 5 follow-up:** an unpaid PENDING order holds its stock until cancelled. Add auto-cancel of stale unpaid orders, or a reservation expiry.
- Checks I ran:
  - The last-unit race (two customers, stock 1) gave one 201 and one 409, stock 0 and exactly one order.
  - A double-cancel gave 200 and 409, and stock was restored once.
  - The transitions are enforced.
  - An admin cancel of a PAID order restocked it.
  - A sized product without a size gave 400.
  - Another customer's order gave 404.
  - Staff routes gave 401 for a customer.
  - The test product and orders were then removed.

**Frontend:**
- `library/api/orders.ts` holds the client and the mappers.
- Cart page: "Place Order" replaces the disabled button. It requires sign-in and a delivery address, sends the lines to `POST /orders`, clears the bag and goes to My Purchase. Errors such as "Only 3 left of …" show as toasts.
- `addToCart` and the quantity stepper now check live stock. The server re-checks at checkout and is the authority. I did not call `/cart/check` from `addToCart`.
- My Purchase (`purchases/page.tsx`) loads real orders. Multi-line orders show an item count and list every line in the modal. Unpaid orders get a "Cancel this order" link. "Pay Now" is still a placeholder until Phase 5.
- Admin orders: the store loads real orders. Status changes call the API, and the server rejects invalid moves. Cancelling reloads inventory. `OrderModal` shows the name and price snapshot.
- `library/orders.ts`: the mock `SAMPLE_ORDERS` is gone.

**Known gaps / notes:**
- **Browser checks:** not yet done for the cart checkout, My Purchase, the cancel dialog and the admin Orders page.
- **Shipping:** there is no shipping fee, so the total is the subtotal.
- **Vouchers:** they are not applied at checkout.
- **Duplicate orders:** there is no protection against a double-click creating two orders (the button disables while placing).
- **Dev data:** two test customers exist (`cust@test.dev` / `NewPass12345`, `cust2@test.dev` / `CustPass123`).

## Phase 5 — payments (manual verification; replaces the original PayMongo plan)

**Decision:** there is no payment-gateway account. Customers pay by GCash, Maya or bank transfer, upload a screenshot, and an admin verifies it by hand. All PayMongo code, its two tables and the `axios` dependency were removed.

**The flow:**
1. The customer places an order (status PENDING, stock is taken). The cart sends them to My Purchase, where a dialog opens (`?pay=<order>`) showing the payment details and the order total.
2. They send the money, then upload a screenshot with the method and an optional reference number (`POST /orders/:no/payment-proofs`).
3. The order shows "Payment to review" in the admin Orders list. An admin opens the order and compares the screenshot with the real GCash/bank statement, then **Approve** (order becomes PAID, history entry "Payment verified (…)") or **Reject** with a reason the customer sees (order stays unpaid and they can upload again).
4. The customer and the shop inbox are emailed at each step (when SMTP is configured; otherwise the emails print in the API console).

**Backend:**
- **Storage:** screenshots are stored in Postgres (\`PaymentProof\` for the metadata, \`ProofFile\` for the bytes, kept apart so lists never load images), not on a public image host. They are served only by \`GET /orders/:no/payment-proofs/:id/image\` to the order's owner or to signed-in staff, with \`Cache-Control: private, no-store\` and \`nosniff\`.
- **Upload checks:** JPG, PNG or WEBP only, judged by the file's real bytes rather than its name; at most 3 MB; one screenshot waiting at a time; at most 5 attempts per order; only while the order is PENDING and belongs to the caller. Rate limited like checkout.
- **Review:** \`PATCH /orders/:no/payment-proofs/:id\` (staff) with \`{decision: "approve"}\` or \`{decision: "reject", reason}\`. It claims the screenshot with a conditional update, so two staff acting at once can't both decide (tested: one 200, one 409). Approving also needs the order to still be PENDING; otherwise the whole thing is undone.
- **Orders carry payment state** (\`none\`, \`review\`, \`rejected\`, \`approved\` plus the list of attempts) in every order response.
- **Safeguards:**
  - The 24-hour "release unpaid orders" sweep skips orders whose screenshot is waiting for review.
  - A customer can't cancel an order while their screenshot is under review (they must contact the shop).
  - Cancelling an order, by anyone, closes any waiting screenshot as rejected ("The order was cancelled").
  - A screenshot can't be uploaded to a cancelled or already-paid order.
- **Payment details** (GCash/Maya number, bank account, a message) are CMS content, \`paymentInstructions\`, edited in Admin → Settings → Payment Details. Only **administrators** can change them (the server enforces it), because changing a number redirects customers' money. Every change logs the account numbers in the audit log.
- **Checks I ran (curl):**
  - Upload validation: a text file named .png, a 3.2 MB file, a bad method, a bad order number, a missing file and another customer's order were all refused.
  - A valid upload, a second one while the first is pending, and a customer cancel while under review: handled as above.
  - Image access: anonymous 401, another customer 404, the owner and staff 200 with identical bytes.
  - Review: reject (reason required, customer sees it), re-review refused, re-upload, approve; history shows the staff member and the reference.
  - The approve/reject race gave one 200 and one 409.
  - Cancelling with a waiting screenshot closed it; the sweep skipped an aged order with a waiting screenshot.
  - A staff-role account got 403 on payment details; an administrator got 200.

**Frontend:**
- **Customer:** \`PaymentProofModal\` shows the order total, the shop's payment details with copy buttons, a method choice, an optional reference and a screenshot picker with preview. My Purchase shows the right action for each state: "Pay Now", nothing while it's under review (the tracker says so), or "Upload New Screenshot" with the rejection reason.
- **Admin:** the order dialog has a Payment section with the screenshot (fetched privately, click for full size), who sent what and when, and Approve / Reject (reject asks for a reason). The orders list marks orders needing review.
- **Admin settings:** a new Payment Details page.

**Known gaps / notes:**
- **Screenshots can be faked.** Staff must confirm the money arrived in the shop's actual GCash/Maya/bank account (and the amount and reference match), not just look at the picture. NEXT_STEPS.md suggests safeguards (duplicate-reference warning, retention).
- **Not tried in a browser** (the API was fully curl-tested).
- **Refunds are manual**, outside the system. There is no record of them yet.
- **If a customer pays after their order was auto-cancelled,** staff have to re-create the order or refund by hand; cancelled orders can't be reopened.
- **No retention rule yet:** screenshots stay in the database until someone deletes them.

## Phase 6 — audit trails

**Backend:**
- **Order history:** `OrderStatusHistory` gets a row for every status change, including the first one (nothing to PENDING). It records the from and to status, the actor and an optional note.
- **Actors:** a customer (placing or cancelling), a staff member (admin status changes), a staff member approving a payment screenshot or the System (the stale-order sweep).
- **Generic trail:** `AuditLog` is for everything else. It holds an entity type and id, an action, the actor and a JSON `details`. Product create, update (with before and after values; description edits are marked as "edited" and a no-op edit writes nothing) and delete are recorded now.
- **`audit.service.ts`:** `record()` and `recordOrderStatus()` take the transaction client, so a record commits or rolls back together with the change. Call it from any future controller that mutates data (the staff and CMS content controllers will).
- **Append-only at the database level:** a migration adds triggers that reject any UPDATE or DELETE on both tables, from the app, a script or psql. Order history can't be deleted by deleting the order (foreign key RESTRICT). Actors are stored as an id plus a name snapshot, with no foreign key, so history survives account deletion. Stock changes were already covered by `StockMovement`.
- **Endpoints:**
  - `GET /orders/:no/history` (staff; oldest first)
  - `GET /audit-log?entityType=&entityId=&page=&pageSize=` (**administrator only**, the first real use of `requireRole`)
- **Checks I ran:**
  - A history was built for each actor path: customer places, admin moves it through PAID, SHIPPED and DELIVERED, customer cancels, payment is approved, and the sweep cancels.
  - A rejected move left no row.
  - The product create, update and delete trail was correct, and the audit log gave 200 to an administrator, 403 to a staff-role account and 401 to a customer.
  - Direct SQL UPDATE and DELETE were rejected.
- **Cleaning up test data:** the triggers also block cleaning up test data, so I disabled them for one transaction on my own test rows and re-enabled them (confirmed enabled). Do the same if you need to wipe dev data.

**Frontend:**
- The admin order modal has a "History" section (who, what, when, note). It reloads after a status change.

**Known gaps / notes:**
- **CMS content and customer accounts:** have no audit history yet. Staff changes are audited (see "Mock data removal").
- **No UI for the audit log:** `GET /audit-log` exists but nothing in the admin panel shows it yet.
- **Past orders:** orders created before this phase have no history rows (none exist in the dev database).

## Phase 7 — CMS, reviews, forms, uploads

**Needs from you to use it for real:**
1. Cloudinary: set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `backend/.env`. Without them the upload endpoint returns 503 and the admin UI falls back to a local-only preview that is NOT saved (a toast says so).
2. Email: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `CONTACT_INBOX`. Without `SMTP_HOST`, emails are printed to the API console instead (including the welcome code).
3. Reviews: the sample reviews were removed, so the shop starts with none; every rating comes from real customers.

**Backend:**
- **Content (CMS):**
  - `GET /content` (all saved sections), `GET /content/:section` and `PATCH /content/:section` (staff).
  - 19 whitelisted section keys, each with its required shape (object or array). The size limit is 500 KB, and nesting is capped at 8 levels. Any string starting with `data:` is rejected, so base64 images can't be stored.
  - Each save is written to the audit log. Only sections an admin has saved exist, and the frontend keeps its built-in defaults for the rest.
  - The JSON body limit was raised to 1 MB.
- **Reviews:**
  - `POST /reviews` (customer) takes a 1 to 5 rating and text, with one review per customer per product (409 on a repeat).
  - `GET /products/:id/reviews` is public and paginated. It shows names as "First L.".
  - A new review is folded into the stored product rating, `(avg × count + new) / (count + 1)`, not recomputed from rows, so the seeded catalogue ratings survive.
  - Reviews go live immediately; there is no moderation.
- **Newsletter, contact, promo:**
  - `POST /newsletter/subscribe` stores the subscriber and sends a welcome email.
  - `POST /contact` stores the message and emails `CONTACT_INBOX`.
  - `POST /promo/subscribe` creates one single-use `WELCOME-XXXXXX` voucher (10%, 30 days) per email address. Asking again re-sends the same code, and the code is only delivered by email.
  - No Mailchimp integration; subscribers live in the database (`Subscriber`). The three forms give the same answer whether or not the address was already known.
  - **Vouchers aren't redeemable yet:** checkout does not apply vouchers (a Phase 4 gap), so welcome codes can be issued but not used.
- **Uploads:**
  - `POST /uploads/signature` takes `{folder}`.
  - Staff may use `products` or `content`. A signed-in customer may use `avatars` only.
  - It returns a Cloudinary signature covering the folder, the format whitelist (jpg, jpeg, png, webp, avif, gif) and the timestamp.
  - I verified the signature against an independent SHA-1, and the secret is never sent to the browser.
- **Customer profile:** `PATCH /auth/customer/profile` updates the name and avatar. An avatar URL must be on our own Cloudinary account. The session response now includes `avatarUrl`.
- **Schema:** new `Subscriber` and `ContactMessage` tables, `Voucher.forEmail` and `usedAt`, and `Customer.avatarUrl`.

**Frontend:**
- **CMS persistence:** `ContentProvider` no longer uses localStorage. The root layout loads the saved sections from the API on every request (not cached, so a saved edit never looks lost on reload) and passes them in. Any section an admin edits is auto-saved to the server about 0.7 seconds later. Embedded base64 images are dropped before saving.
- **Images:** `validateAndReadImage(file, folder)` now does the signed upload to Cloudinary and returns a hosted `url`. Callers were updated, including the product photo, which now uploads for real.
- **Reviews:** the product page loads real reviews. The review modal no longer asks for a name (it uses the account name) and requires sign-in. The "submitted for moderation" copy changed to "your review is live".
- **Forms:** the newsletter, contact and welcome-promo forms call the API. The popup no longer shows the fake `RITUAL10` code.
- **Account page:** name and photo are saved to the server. The avatar shows in the account page, but the Navbar still shows the initials only.

**Known gaps / notes:**
- **Browser checks:** I have not tried any of this in a browser. I did check that the pages compile and respond, and that a saved headline appears in the server-rendered homepage HTML.
- **Real Cloudinary and mail accounts:** not tried with real accounts.
- **Old local edits:** anything an admin edited before this change lived only in that browser's localStorage and is now ignored (the old keys remain unused).
- **Default images:** bundled placeholder images in blog posts, rituals and concerns are saved as their built URL. That keeps working until those images' file contents change; replacing them with uploaded images removes the issue.
- **Concurrent admin edits:** two admins editing the same section: the last save wins. Optimistic locking is a Phase 8 topic.
- **No unsubscribe, double opt-in or admin view** of subscribers or contact messages.
- **Rate limiting:** the public forms are not rate limited yet (Phase 8).

## Phase 8 — hardening

**Rate limiting (`middleware/rateLimit.ts`, express-rate-limit, in-memory):**
- Sign-in failures only (successes aren't counted):
  - Customer login: 10 per 15 minutes per address+email.
  - Admin login: 5 per 15 minutes per address+email.
  - Both: 40 per 15 minutes per address.
- OTP request: 5 per hour per address+email. OTP verify: 10 per 15 minutes.
- Second-factor login attempts: 8 per 15 minutes per address.
- Password change and 2FA enrol/disable are limited per account: 10 per 15 minutes.
- Public forms: 10 per hour. Sign-up: 10 per hour.
- Orders, payments, reviews: 30 per hour. Upload signatures: 60 per hour.
- A global backstop of 300 requests per minute per address.
- A blocked request gets a JSON 429 with `Retry-After`.
- **Deployment:** set `TRUST_PROXY` to the number of reverse proxies in front of the API, or every client shares the proxy's address. Counters live in memory, which is right for one API process; several instances need a shared store such as Redis.

**Pagination (nothing returns an unbounded list):**
- `GET /products` and `/products/admin` are now paged (default 100, max 200) and return `total`. Orders, stock log and audit log (max 100), reviews (max 50) and the CSV export (5,000 rows) were already capped or are now.
- An oversized `pageSize` returns 400.
- The frontend walks the pages for the catalogue, admin products and orders. The admin stock log loads the newest 100 entries only.

**Optimistic concurrency on products:**
- `Product.version` is bumped by every detail edit. `PATCH /products/:id` requires the `version` it was based on.
- The bump is a conditional UPDATE that also locks the row, so two admins saving at once can't both pass. Verified: two simultaneous edits gave one 200 and one 409, and a stale edit gave a clear 409.
- A stale edit is rolled back as a whole, including size changes. Stock adjustments are relative, so they don't bump the version.
- The admin UI sends the version it loaded and shows the 409 message.
- **Not covered:** CMS content sections are still last-save-wins.

**Validation:** all mutating endpoints validate input with zod (existing controllers inline, plus the new `middleware/validate.ts`, which also validates route params). Checks added: order-number and session-id parameters are format-checked, and unknown body fields are stripped on validated routes. I checked each mutating route by hand. Bad JSON gives 400.

**Admin sessions (server-side, revocable):**
- Each sign-in creates an `AdminSession` row, and the JWT carries its id. `requireStaff` rejects a token whose session is missing, revoked or expired, and re-reads the staff row every request.
- `GET /auth/admin/sessions`, `DELETE /auth/admin/sessions/:id` (own sessions only) and `POST /auth/admin/sessions/revoke-others`. Logging out also revokes the session, so a copied cookie stops working.
- `POST /auth/admin/password` changes the password (current password required), signs out every other device and writes an audit entry.
- Dead sessions are purged by the 5-minute sweep. Sessions issued before this phase no longer work; admins sign in again.

**Admin two-factor (TOTP, otplib + qrcode):**
- Setup returns a QR code and a manual key. The secret is encrypted at rest (AES-256-GCM with a key from `TOTP_ENCRYPTION_KEY`, or derived from `JWT_SECRET`). Enabling requires a valid code and returns 8 one-time recovery codes, stored only as hashes.
- A password step on a 2FA account returns no cookie, only a 5-minute challenge. `POST /auth/admin/login/2fa` exchanges the challenge plus a code (or a recovery code) for a session. A used code or time step can't be replayed, and a recovery code works once.
- Disabling requires the password and a current code. Enabling, disabling and password changes are written to the audit log.
- 2FA is optional per account; nothing forces administrators to use it.
- Checks I ran:
  - Wrong code, forged challenge and replay all gave 401.
  - A same-time-step code was rejected.
  - A recovery code worked once.
  - The stored secret is not the plain secret.

**Frontend:**
- **Sign-in:** the admin sign-in has a second step for accounts with 2FA, and the "demo access" line is gone.
- **Sessions page:** it lists real sessions with per-session sign out and "log out all other devices".
- **Security settings:** real password change, and a 2FA enrol dialog (QR, manual key, confirmation code, recovery codes shown once) and a disable dialog.
- **Customer account:** it now has a real change-password page too, with its own endpoint, `POST /auth/customer/password`.
- **Confirm dialogs:** they no longer add a fake 700 ms delay.

**Known gaps / notes:**
- **Browser checks:** none of the frontend pieces were tried in a browser. I did check that pages compile and respond, and that the proxy bounces a revoked session to the login page.
- **Customer accounts:** customers have no session list, no 2FA, and no "sign out everywhere".

## Mock data removal, real staff / customers / notifications

Everything that was invented placeholder data was removed, except the shop's own site text and images (default page content, product names/descriptions/prices and their photos). What replaced each piece:

**Real data now (backend + frontend):**
- **Staff** (Admin → Staff): `GET/POST/PATCH/DELETE /staff`, administrators only. Create with a password; edit name, email, role, access, photo; deactivate; set a new password; turn off someone's two-factor when they lose their phone. The server refuses the unsafe cases: you can't change your own role, access or active status, delete yourself, or demote/deactivate/delete the last active administrator (administrator rows are locked while counting, so two admins can't remove each other at once). Role, access, active, email and password changes sign that person out everywhere. Every change is audited (never the password).
- **Access levels are now enforced by the server**, not just hidden in the menu (`middleware/section.ts`, `lib/sections.ts`): "Inventory only" gets inventory routes; "Orders only" gets order routes and payment review; "Inventory & orders only" both; "Full access" also content and the customer list; administrators everything. Everyone keeps the dashboard and their own security settings. **"Custom" currently grants nothing extra** (it was never defined), and any unrecognised value is denied. The menu rule in `library/admin/permissions.ts` mirrors it. Checked with a "Orders only" account: orders 200; inventory, stock log, content save, customers and staff all 403; widening their access took effect on their next sign-in.
- **Customers** (Admin → Users and the dashboard's signup numbers): `GET /customers` (paginated, searchable; "Full access" or administrator), real accounts only.
- **Notification bell**: `GET /notifications` works the list out from live data — new orders from the last 7 days, payment screenshots waiting for review, products low or out of stock — limited to what the person's access allows; "seen" marks are stored per person (`NotificationRead`), and the bell refreshes every minute.
- **Dashboard charts**: sales-by-location and top-selling products are computed in the browser from the real orders (cancelled ones excluded): daily points for 7 days, 5-day buckets for 30, 15-day for 90. Empty periods say so. Checked against hand-made sample orders.
- **My Vouchers** (`GET /vouchers/mine`): the customer's own unused, unexpired welcome codes, or an empty message.

**Removed outright:**
- Sample orders, stock log, staff, customers and notifications (`ADMIN_ORDERS`, `STOCK_LOG`, `STAFF`, `ADMIN_USERS`, `NOTIFICATIONS`) and the hand-written dashboard series.
- The fake default delivery address "221B Kalayaan Ave" (and it is dropped from browsers that had saved it), and the sample bag/wishlist the admin previews used to show.
- The six sample reviews, their placeholder reviewer accounts, and the invented star ratings (e.g. 4.5 from 142 reviews): products now start at zero, and the stars show "No reviews yet" until a real review arrives. `npm run seed-reviews` was deleted and `seed-products` no longer sets ratings.
- The two notification-preference pages (customer Account and admin Settings). Their switches were never saved or read by anything, so they were fake settings. Re-add them when emails exist that obey them.

**Kept on purpose:** the default website text and images, and the sample product catalogue (names, descriptions, prices, photos). Replace those in the admin as you like.

**Not done:**
- Customer delivery addresses and the wishlist still live only in the browser (the Address table exists but has no endpoints).
- Customer-facing notification preferences.
- The dashboard's top-level order counts and charts load up to 2,000 orders into the browser, which is fine for now but should become a server-side rollup if volume grows.
- Not tried in a browser; the API pieces were curl-tested.

## Menus follow permissions; order import/export

- **Menu links:** links to pages an account can't use are hidden: the settings menu (Payment Details is administrators only), the dashboard's tiles / "View all" buttons / chart clicks, and the low-stock dialog's "Go to Inventory". The sidebar and the profile menu already did this. A page guard in `AdminAuthGate` also sends someone who types or bookmarks a page they can't use back to the dashboard with a message. The rules are in `library/admin/permissions.ts` (`sectionForPath`, a new administrators-only "payments" section).
- **Order export:** `GET /orders/export.csv?status=&from=&to=`: every order, not just the page loaded in the browser. Customer-typed cells that look like spreadsheet formulas are neutralised.
- **Order import:** `POST /orders/import` takes a CSV with `Order` and `Status` columns and applies each row through the normal status rules (allowed moves, stock returned on cancel, history "Status import"); unusable rows are reported, up to 500 rows. It does not create orders.
- **Who:** anyone with Orders access (Full access, Inventory & orders only, Orders only) may export, import, view screenshots and **approve payments**. Tested with an Orders-only account (all allowed) and an Inventory-only account (all refused with 403).
- The full who-can-do-what list is in `ROLES_AND_PERMISSIONS.md`.

## Roadmap status
Phases 0 to 8 are built and tested at the API level. The honest remaining work, in the order I'd do it:
1. **Run it for real once:** a real payment-verification run-through (Phase 5), a Cloudinary account and SMTP credentials, and a browser pass through the customer and admin flows.
3. **Voucher redemption at checkout, refunds, and a shipping fee.**
