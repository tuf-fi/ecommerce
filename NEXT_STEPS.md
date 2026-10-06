# Next Steps — Cindyrella

A working checklist for what's left after Phases 0–8 (see `BACKEND_PROGRESS.md` for what was built). Do the parts in order: Part A is setup, Part B proves what's built actually works, Part C is the remaining build work (each item says how to do it), Part D is launch prep (with how-to). Tick boxes as you go.

---

## What's left — summary, in priority order

The code for the original roadmap (Phases 0–8) is built. What remains is mostly proving it works, a few gaps in the shop, and going live. Details and how-to for each item are in the parts below.

### 1. Prove what's built works (about a day, no new code) — Part B
- [ ] **Browser pass (B1):** nothing in the frontend has been clicked through yet. Do the customer flow and the admin flow, including the Staff page, the notification bell, the dashboard charts, and order import/export.
- [ ] **Manual payment run (B2):** place an order, upload a screenshot, reject it, upload again, approve it. The backend is tested; the screens are not.
- [ ] **Cloudinary (B3) and real email (B4):** need your accounts. Until then, uploads show an unsaved preview and emails print in the API terminal.

### 2. Gaps in the shop itself — Part C
- [x] **Vouchers (C2):** done. Customers type a code in the cart; the server applies it, uses it up exactly once, and gives it back if an unpaid order is cancelled. Administrators manage codes in Settings → Discount Codes.
- [x] **Shipping fee (C4):** done. Administrators set a flat fee and an optional free-shipping amount in Settings → Payment Details → Shipping. Until they do, shipping is free.
- [x] **Refunds (C3):** done. Administrators record a refund on a paid order (amount + note); the customer is emailed and it shows in the order, the audit log and the CSV export. The money itself is still sent back by hand.
- [x] **Customer addresses and wishlists (C5):** done. Both are saved on the server per customer and follow them to any device; a wishlist built before signing in is merged in at sign-in.
- [x] **"Custom" access level (C1):** removed from the Staff dropdown and the server. The four remaining levels are Full access, Inventory & orders only, Inventory only, Orders only.

### 3. Smaller improvements, all optional — C6 and C7
- [ ] **Payment safeguards (C7):** warn on reused reference numbers, a "payments to review" badge, delete old screenshots after 90 days, and optionally let only administrators approve large orders.
- [x] **Screens for data that is already stored:** Settings → Audit Log (administrators), Newsletter Subscribers and Contact Messages (administrators and staff with Full access).
- [x] **Extras (C6):** newsletter unsubscribe links, order emails to customers, customer sign-out-everywhere, Google sign-in — all built. Two need your accounts to see working: emails need SMTP (B4) and Google sign-in needs a Google client id (`GOOGLE_CLIENT_ID` in `backend/.env` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `frontend/.env.local`); without them the button says it isn't available.
- [ ] **Click through all of the above in a browser.** The backend for these was tested with real requests (including simultaneous orders on one code, and stock failures rolling a code back); the new screens compile and load but nobody has used them yet.

### 4. Before you go live — Part D
- [ ] **Secrets and accounts (D1, D2):** fresh secret keys; replace the test accounts with real ones; turn on two-factor for every administrator.
- [ ] **Database (D3):** a managed Postgres with automatic backups, and a restore you have practised.
- [ ] **Login cookies across your two addresses (D6):** the site and API need a shared parent domain (e.g. `www.yourshop.ph` and `api.yourshop.ph`), and the code needs a small `COOKIE_DOMAIN` change. Without it, admins look signed out on the live site.
- [ ] **Start script (D4):** the API has no production `start` script yet.
- [ ] **Payment procedure (D7):** write down who checks screenshots, how fast, and how you match them to the real GCash / bank statement.
- [ ] **Email sender (D8):** SPF/DKIM records so emails don't land in spam.
- [ ] **Monitoring (D9) and a final real small order (D10).**

**Suggested order:** do section 1 first because it shows what is actually broken; then server-side customer addresses; then the cookie-domain and start-script changes; then Part D.

---

## Part A — Get everything running locally

- [ ] **Start Postgres.**
  ```powershell
  docker start cindyrella-db
  ```
  (If the container is gone: `docker run --name cindyrella-db -e POSTGRES_PASSWORD=devpassword -p 5432:5432 -d postgres:16`, then in `backend/` run `npx prisma migrate deploy` and `npm run seed-products`.)
- [ ] **Start the API** (port 4000):
  ```powershell
  cd backend
  npm run dev
  ```
  Check: `curl localhost:4000/health` returns `{"ok":true}`.
- [ ] **Start the storefront** (port 3000), in a second terminal:
  ```powershell
  cd frontend
  npm run dev
  ```
- [ ] **Know the test accounts** (dev database only):

  | Who | Email | Password |
  |---|---|---|
  | Administrator | admin@cindyrella.test | AdminPass123 |
  | Staff | staff@cindyrella.test | StaffPass123 |
  | Customer | cust@test.dev | NewPass12345 |
  | Customer 2 | cust2@test.dev | CustPass123 |

  Make more staff with `npm run create-staff -- <email> <password> "<name>" [ADMINISTRATOR|STAFF]` (in `backend/`).
- [ ] **Know where "emails" go.** With no SMTP configured, every email (password-reset code, welcome code, newsletter welcome) is printed in the **API terminal**, not sent.

---

## Part B — Prove what's built actually works

Nothing in the frontend has been clicked through in a browser yet. Do B1 first; it will find the most problems for the least effort. Write down every problem you hit (what you did, what you expected, what happened) and bring the list back.

### B1. Browser pass (no external accounts needed)

**Customer side** (use a normal window at http://localhost:3000):
- [ ] Home page loads; the shop shows all 24 products with images.
- [ ] Open a product with sizes (e.g. Overnight Retinol Serum): choose a size, add to bag. Try adding more than the stock — you should get an "Only N left" message.
- [ ] Sign up with a new email, sign out, sign in again. Refresh the page — you should stay signed in.
- [ ] Forgot password: request a code, copy the 6-digit code from the **API terminal**, set a new password, sign in with it.
- [ ] Cart → pick/confirm a delivery address (Account → Addresses) → **Place Order**. You land on My Purchase and the payment dialog opens by itself (details in B2). Close it with "Later" and the order stays "To Pay" until you upload a screenshot.
- [ ] My Purchase: open the order, **Cancel this order**, confirm. The stock on the product page goes back up.
- [ ] Product page: write a review (rating + text). It should appear immediately; a second review of the same product should be refused.
- [ ] Account → Personal Information: change your name and save; reload and confirm it stuck.
- [ ] Account → Change Password: change it, sign out, sign in with the new one.
- [ ] Newsletter box, Contact form and the welcome pop-up (scroll down the home page): submit each, confirm the "email" shows in the API terminal.

**Admin side** (use a private window at http://localhost:3000/admin/login):
- [ ] Sign in as the administrator. Visiting /admin pages while signed out should bounce you to login.
- [ ] Inventory: add a product, edit it, change its stock (you should be asked for a **reason**), delete it. Open Stock Movements and check each change appears.
- [ ] Edit the same product in two browser windows, save in window 1, then save in window 2 — window 2 should be refused with a "someone else changed this" message.
- [ ] Inventory → import/export CSV works.
- [ ] Orders: place an order as a customer, then in admin change it Pending → Paid → Shipped → Delivered. Open the order and check the **History** section lists each step. Try an invalid move (Delivered → Pending) and confirm it's refused.
- [ ] Orders → Export downloads a spreadsheet of every order. Edit the Status column of a few rows (for example Pending → Paid), then Orders → Import it: the orders change, and rows that aren't allowed (like Pending → Delivered) are listed as skipped.
- [ ] Permissions: sign in as a staff member with only "Orders only" access. The menu should show Dashboard, Orders and Settings only; typing /admin/inventory should bounce back to the dashboard; Settings should not list Payment Details. They should still be able to approve a payment screenshot.
- [ ] Content: edit the hero headline, wait about a second, reload the home page in the other window — the new headline should be there. Do the same for one list (FAQs).
- [ ] Staff: add a staff member with "Orders only" access, sign in as them in a private window and check they can use Orders but not Inventory, Content or Staff. Try to delete yourself or demote the only administrator and confirm you're refused.
- [ ] Dashboard and bell: after placing an order, the dashboard's Sales Trend / Top Selling charts show it, the bell shows "New order …", and "Mark all read" sticks after a reload.
- [ ] Users: the Users list shows the real customers (not the made-up ones).
- [ ] Settings → Sessions: sign in from a second browser; both appear; sign the other one out and confirm it's kicked out.
- [ ] Settings → Security: change the password, then turn on two-factor (scan the QR with an authenticator app, enter the code, **save the recovery codes**). Sign out and back in — you should be asked for a code. Turn two-factor off again when done testing.

### B2. Manual payment verification (customer sends a screenshot, you approve it)

This replaces the earlier PayMongo plan. No external account is needed.

- [ ] **Set your payment details.** Admin → Settings → Payment Details (Administrators only). Enter the GCash / Maya number and/or bank account customers should pay, the account name, and a short message. Save. (Use your real numbers, or obvious test ones while testing.)
- [ ] **Place an order as a customer.** After "Place Order" you land on My Purchase and the payment dialog opens by itself, showing the exact total and your payment details (the "Copy number" buttons should work).
- [ ] **Upload a screenshot.** Any JPG/PNG/WEBP image works for testing. Pick the method, add a reference such as `TEST-001`, send it. The order now says "We're checking your payment screenshot" and has no button.
- [ ] **Staff are told.** The order shows **Payment to review** in Admin → Orders. If `CONTACT_INBOX` and SMTP are set you also get an email; otherwise it prints in the API terminal ("Payment proof to review").
- [ ] **Reject it first.** Open the order in admin. You see the screenshot (click for full size), the method and reference. Press **Reject**, type a reason ("Amount is lower than the total"), confirm. As the customer, My Purchase now shows "Screenshot not accepted: …" and an **Upload New Screenshot** button.
- [ ] **Upload a second one and approve.** Admin presses **Approve — mark Paid**. The order becomes **Paid** (the customer sees "To Ship"); the order History shows "Payment verified (GCash, ref TEST-001)" by your name; the customer gets a "Payment received" message (email or API terminal).
- [ ] **Edge cases worth a minute:**
  - While a screenshot is waiting, the customer can't cancel the order (they're told to contact you).
  - An unpaid order with **no** screenshot is cancelled automatically after 24 hours and its stock returns. To test, set that order's `createdAt` back a day in `npx prisma studio`; the check runs every 5 minutes. An order whose screenshot is **waiting for review** is never auto-cancelled.
  - Uploading a text file renamed `.png`, or an image over 3 MB, is refused.
  - A Staff-role account can see Payment Details but can't save them.
- [ ] **In real use, always check the money itself.** A screenshot proves nothing by itself, since they are easy to fake. Before approving, open the actual GCash / Maya / bank app and confirm a payment of the right amount (and ideally the reference number) really arrived.

### B3. Cloudinary (image uploads)

- [ ] Create a free Cloudinary account. From its dashboard copy the cloud name, API key and API secret into `backend/.env`:
  `CLOUDINARY_CLOUD_NAME=`, `CLOUDINARY_API_KEY=`, `CLOUDINARY_API_SECRET=`. Restart the API.
- [ ] Admin → Inventory → edit a product → upload a photo → save. Reload; the photo should still be there, and the image address should be a `res.cloudinary.com` URL.
- [ ] Admin → Content → hero image upload, and Account → Change Photo as a customer.

### B4. Real email (SMTP)

- [ ] Pick a mail service (your host's SMTP, Gmail app password, Mailgun, etc.). Put the details in `backend/.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, and `CONTACT_INBOX` (where the Contact form should deliver). Restart the API.
- [ ] Submit the Contact form, the newsletter box and the welcome pop-up with your own address; check your inbox.
- [ ] Forgot-password on a customer account: the code should now arrive by email instead of the API terminal.

---

## Part C — Remaining build work, with how to do each

Each item says **what to change**, **how**, and **how to test it**. They are independent; do them in this order (C1 first, because it closes the biggest security gap). You can hand any item to Claude as-is: "do C2".

Conventions used throughout (they match how the existing code is written):
- Backend routes live in `backend/src/routes/*.routes.ts`, logic in `controllers/` and `services/`. New tables go in `backend/prisma/schema.prisma`, then `npx prisma migrate dev --name <what>` and `npx prisma generate` (Prisma 7 does not regenerate the client on migrate).
- Validate every request body with zod (see `controllers/adminSecurity.controller.ts` for the pattern) and apply `validate({...})` from `middleware/validate.ts` to route params.
- Record every staff mutation with `record(tx, {...})` from `services/audit.service.ts`, inside the same transaction.
- On the frontend, follow the products pattern: API functions in `frontend/library/api/*.ts`, state in `library/adminStore.tsx` with a `reload…()` after each mutation and `errorMessage()` for failures.

### C1. Staff management — DONE

Built: the Staff page now manages real accounts (add, edit, deactivate, set a password, turn off someone's two-factor, delete), administrators only, with the "last administrator" and "not yourself" protections, audit entries, and **server-enforced access levels**. See "Mock data removal" in `BACKEND_PROGRESS.md`. What to still do:
- [ ] **Try it in a browser**: add a staff member with "Orders only", sign in as them in a private window, and confirm the menu shows only what they may use and other pages are refused. Then deactivate them and confirm they're signed out.
- [x] **"Custom" access** — removed (dropdown, server list and the browser-side permission map). Any account that still holds the old value gets no section access (fails closed) until an administrator picks one of the four levels.
- [ ] **Optional:** let administrators require two-factor for every staff account.

### C2. Vouchers at checkout — DONE

Built (the design below is what was implemented, with these differences): the preview goes through `POST /cart/check` with an optional `voucherCode` instead of a separate `/cart/voucher`; reusable codes use `Voucher.maxUses/uses` plus a `VoucherUse` table (one use per customer per code); the cart (`app/cart/page.tsx`), the order dialog and `GET /vouchers/mine` for the My Vouchers page are wired up; administrators create and switch off codes in Settings → Discount Codes (`/discount-codes`). Not done: seeding a `RITUAL10` demo code — create it from the new page if you want it.

**Goal:** a customer can enter a code in the cart; the server applies the discount; single-use codes are used up exactly once.

**Backend**
1. Schema: `Order` gets `voucherCode String?` and `discount Int @default(0)`. (`Voucher` already has `code, percentOff, expiresAt, active, forEmail, usedAt`.) Migrate.
2. `services/voucher.service.ts`:
   - `redeemVoucher(tx, code, customerEmail)` — a single conditional update claims it atomically:
     `tx.voucher.updateMany({ where: { code, active: true, usedAt: null, OR: [{ forEmail: null }, { forEmail: customerEmail }], AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }] }, data: { usedAt: new Date() } })`. `count === 0` → throw `HttpError(409, "That code isn't valid")` (don't reveal which condition failed). Then read the voucher for `percentOff`.
   - `quoteVoucher(code, email)` — same checks without claiming, for the preview.
3. `orders.service.ts` `createOrder`: accept `voucherCode?`; after computing `subtotal`, call `redeemVoucher` **inside the same transaction**, set `discount = Math.round(subtotal * percentOff / 100)`, `total = subtotal - discount`. If stock then fails, the transaction rolls back and the voucher is not consumed.
4. Cancellation policy: if an unpaid order is cancelled, set that voucher's `usedAt = null` again (do it in `changeOrderStatus` when cancelling a PENDING order). Decide if a paid-then-cancelled order gets its code back.
5. Endpoints: `POST /cart/voucher` `{code, items}` → `{discount, total}` (reuse `checkCart` pricing + `quoteVoucher`); `GET /vouchers/mine` (customer) → vouchers where `forEmail = their email` and not used/expired. Add `voucherCode` to the `createSchema` in `controllers/orders.controller.ts`.
6. Payment: there is no gateway to inform. The amount customers are asked to send is `order.total`, which already includes the discount, so the payment dialog and the review screen need no change. Make sure staff see the discount line in the order dialog.
7. Seed the old demo code: a small script creating `RITUAL10` (10%, `forEmail` null, no expiry, reusable). General reusable codes need a different rule than single-use ones — add a `maxUses Int?` + `uses Int @default(0)` to `Voucher` if you want "RITUAL10 usable by anyone once each"; track per-customer use in a `VoucherUse(voucherId, customerId)` table with a unique pair.

**Frontend**
1. `app/cart/page.tsx`: a promo input under the subtotal; on Apply call `POST /cart/voucher`, show the discount line and new total; pass `voucherCode` to `placeOrder`.
2. `app/account/vouchers/page.tsx`: replace the hard-coded `VOUCHERS` with `GET /vouchers/mine`.
3. `components/modals/WelcomePromoModal.tsx` already issues real codes — nothing to change.

**Test:** claim a welcome code (Part B1), apply it in the cart, place the order → total is 10% lower; reuse the same code → 409; two simultaneous orders with the same code → exactly one succeeds (same technique as the stock race test); cancel the unpaid order → the code works again.

### C3. Refunds (manual) and payment mistakes — refunds DONE

Built: `POST /orders/:no/refund` (administrators; once per order; amount up to the total; audit entry; email to the customer), a Money section with a "Record a refund" form in the order dialog, the refund shown on the order and in the CSV export, and a reminder in the cancel confirmation when the order was already paid. Not built: the `reopen` endpoint for mistaken auto-cancels (step 5) and showing the refund in My Purchase.

Money is returned outside the system (you send it back through GCash or your bank). The system should *record* that, so nothing is forgotten and the customer is told.

**Backend**
1. Schema: `Order` gets `refundedAt DateTime?`, `refundAmount Int?`, `refundNote String?`. Migrate.
2. `POST /orders/:no/refund` (`requireStaff, requireRole("ADMINISTRATOR")`) with `{ amount, note }`. In one transaction: require the order to have been paid (an APPROVED payment proof exists), no earlier refund, `0 < amount <= order.total`; set the three fields; add a `record(tx, {...})` audit entry and an `OrderStatusHistory`-style note (history needs a status change, so use the audit log: `entityType "order"`, `action "refund"`). Email the customer ("We've refunded ₱X to your GCash").
3. Stock: cancelling a paid order already puts the items back. If goods physically come back after delivery, use the existing stock-adjustment endpoint with reason `RETURN`.
4. Reminder on cancel: in `OrderModal`, when an admin cancels an order whose payment was approved, show "Remember to refund ₱X" and offer the refund form straight away.
5. Mistaken auto-cancel: add `POST /orders/:no/reopen` (Administrator) for orders cancelled by the system while a customer was paying. It should set the order back to PENDING and take the stock again with `adjustStockTx` (it fails with "out of stock" if the items sold meanwhile) and write a history row.

**Frontend:** a "Record refund" button in `components/admin/modals/OrderModal.tsx` for paid orders (amount + note, Administrators only); show "Refunded ₱X on <date>" in the order and in My Purchase.

**Test:** refund a paid order, a second refund is refused, the amount can't exceed the total, a Staff-role account gets 403, and the audit log shows who did it.

### C4. Shipping fee — DONE

Built as an administrator setting rather than env variables: `shipping` content (flat fee + free-over amount) edited in Settings → Payment Details, applied server-side in `createOrder` and `/cart/check`, shown as its own line in the cart and the order dialog. By-region fees are not built.

1. Decide the rule: flat rate, free over a threshold (e.g. ₱2,000 — the demo promo text already says "free shipping on orders over ₱2,000"), or by region.
2. Backend: put the rule in one function, `services/shipping.service.ts` `shippingFee(subtotal, address)`, configured by env (`SHIPPING_FLAT=150`, `FREE_SHIPPING_OVER=2000`). Schema: `Order.shippingFee Int @default(0)`. In `createOrder`: `total = subtotal - discount + shippingFee`.
3. Return the breakdown from `POST /cart/check` (`subtotal`, `shippingFee`, `total`) so the UI never duplicates the rule.
4. Nothing to send to a gateway: the payment dialog already shows `order.total`, so it will include the shipping fee automatically. Show the fee as its own line in the cart and in `OrderModal`.
5. Frontend (`app/cart/page.tsx`): the row currently says "Calculated at checkout"; call `cart/check` when the bag or address changes and show the real fee and total.
6. By-region fees need structured addresses: add `province`/`city` fields to `Address` and the order snapshot (today the address is one free-text string).

**Test:** orders just under and just over the free-shipping threshold; the total in the payment dialog and in the admin order match.

### C5. Mock data — DONE, with a few follow-ups

The invented admin data is gone (staff, customers, notifications, dashboard charts, sample orders and reviews); see "Mock data removal" in `BACKEND_PROGRESS.md`. Still open:
- [x] **Customer delivery addresses (and wishlists) on the server — done.** (Original note: they lived only in the customer's browser.) Add `GET/POST/PATCH/DELETE /addresses` (customer, own addresses only, one default), load them after sign-in in `library/store.tsx`, and use them in `app/account/addresses/page.tsx`. The `Address` table already exists. Also save the wishlist per customer the same way if you want it to follow them across devices.
- [ ] **Dashboard on the server** when order volume grows: a `GET /admin/stats?range=` doing the sums in SQL (`date_trunc('day', "createdAt")`, `groupBy`), instead of computing from up to 2,000 orders in the browser (`library/admin/dashboard.ts`).
- [ ] **Save the location on the order** (`shipCity` at checkout) rather than reading it out of the free-text address (`library/admin/location.ts`).
- [ ] **Notification preferences, done properly.** The two fake pages were removed. Bring them back only together with the thing they control: store preferences on `Customer` / `StaffMember` (a JSON column), then have `sendMail` and the order/stock events check them before emailing.

### C6. Smaller improvements

- [x] **Audit log / subscribers / messages viewers — done** (Settings → Audit Log, Newsletter Subscribers, Contact Messages).
  Original plan: Backend: the audit endpoint exists; add `GET /subscribers` and `GET /contact-messages` (staff, paginated). Frontend: pages under `app/admin/(panel)/` (e.g. `settings/audit`) with a table, filters (entity, id) and a page selector; copy the layout of the Stock Movements page.
- [x] **Newsletter unsubscribe — done** (link in the welcome and promo emails; landing page `/unsubscribed`).
  Original plan: Put a link in every marketing email: `${API}/newsletter/unsubscribe?e=<email>&t=<token>` where `token = HMAC-SHA256(email, JWT_SECRET)` (hex). The handler recomputes the token with `timingSafeEqual`, deletes the `Subscriber` row, and redirects to a "you've been unsubscribed" page.
- [ ] **CMS conflict protection.** Return each section's `updatedAt` in `GET /content` (it's already stored), pass it into `ContentProvider`, send it as `expectedUpdatedAt` with each save, and in `saveContent` use `updateMany({ where: { key, updatedAt: expected } })`; no match → 409 and a toast "Someone else edited this — reload".
- [x] **Customer sign-out-everywhere — done** (Account → Change Password → "Sign out of all devices"; implemented with a per-customer token version rather than a sessions table). A "devices" list page is not built.
  Original plan: mirror the admin work: a `CustomerSession` table + `jti` in the customer JWT, a "devices" page, and `POST /auth/customer/logout-all`.
- [x] **Google sign-in — built, untested with Google** (needs your client id, see above).
  Original plan: Use Google Identity Services in the login modal to get an ID token, `POST /auth/customer/google {idToken}`; the backend verifies it with the `google-auth-library` package (`OAuth2Client.verifyIdToken`, checking audience = your client id and `email_verified`), finds-or-creates the `Customer` by email, and sets the normal `customer_token` cookie. Create the OAuth client in Google Cloud Console and add `GOOGLE_CLIENT_ID` to both apps' env.
- [x] **Order emails — done** (placed, status changes, refund; sent after the order is saved; printed in the API terminal until SMTP is set).
  Original plan: In `services/orders.service.ts`, after a successful commit (never inside the transaction), call `sendMail` for "order placed", "shipped" and "delivered" using the order's `shipEmail`. Keep the text in a small `services/emailTemplates.ts`.

### C7. Make manual verification harder to fool

Do these after C1. Each one is independent.
1. **Duplicate-reference warning.** A fraudster can reuse one real screenshot on many orders. When listing orders for admin, look up other proofs with the same `reference` (trimmed, case-insensitive) and return `duplicateOf: ["LM-1012", …]`; show a warning banner in the Payment section. Add `@@index([reference])` to `PaymentProof` first.
2. **Ask for the amount and sender.** Add `amount Int?` and `senderName String?` to `PaymentProof` and to the upload form, and show them beside the order total in the review panel with a red mismatch highlight (customer typed ₱1,000 but the total is ₱1,650).
3. **Count to review.** A badge on the Orders menu item with the number of orders in "Payment to review". Backend: `GET /orders/admin?payment=review` (add the filter to the `listQuery` in `orders.controller.ts`); frontend: reload the count every minute.
4. **Retention.** Delete the image bytes (`ProofFile` rows, keeping the metadata) 90 days after an order is delivered or cancelled. Add it to the 5-minute sweep in `backend/src/index.ts` (it can check a "last ran" date so it only works once a day). Mention it in your privacy page, since screenshots show account numbers and names.
5. **Second approver for big orders.** Optional: refuse approval by a Staff-role account when `order.total` is above a threshold (env `PROOF_APPROVER_MIN_TOTAL`), so only Administrators can approve those. Enforce it in `reviewProof`.
6. **Smaller files.** Resize/strip metadata with the `sharp` package before storing, to save space and remove location data from phone screenshots.

---

## Part D — Before you go live, with how-to

### D1. Secrets
- Generate each secret separately (run once per secret; never reuse):
  ```powershell
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
  Use one output for `JWT_SECRET` and another for `TOTP_ENCRYPTION_KEY`. **Set `TOTP_ENCRYPTION_KEY` before anyone enables 2FA** — changing either value later makes existing 2FA setups unreadable (admins would have to be reset in the database).
- Keep all secrets in your hosting provider's environment-variable settings, not in files. `backend/.env` and `frontend/.env.local` are git-ignored; keep it that way.
- Use separate Cloudinary folders (or accounts) and a separate email sender for testing and production.

### D2. Accounts and data
1. Create real administrators on the production database: `npm run create-staff -- you@yourshop.ph "<strong password>" "Your Name" ADMINISTRATOR`.
2. Sign in, turn on 2FA (Settings → Security), save the recovery codes in a password manager.
3. Delete the test staff: in `npx prisma studio` (pointed at production, carefully) or SQL — remove `admin@cindyrella.test` and `staff@cindyrella.test`, and the test customers/placeholder reviewers if you don't want them.
4. Decide whether to run `npm run seed-products` (sample catalogue) or add your real products in the admin panel.

### D3. Database
1. Pick a managed Postgres (examples: Neon, Supabase, Railway, Render, AWS RDS). Create a database and copy its connection string into `DATABASE_URL` (use the "pooled" string only if your host recommends it for Prisma).
2. Apply the schema: from `backend/` with `DATABASE_URL` pointing at it, run `npx prisma migrate deploy` (this applies the existing migrations without creating new ones).
3. Backups: turn on the provider's automated daily backups. Also practise a restore once. A manual dump of the local database, as an example: `docker exec cindyrella-db pg_dump -U postgres cindyrella > backup.sql`, restore with `psql … < backup.sql` into an empty database.

### D4. Run the API in production
1. Add a start script to `backend/package.json`: `"start": "node dist/index.js"` (there isn't one yet; the file already has `"build": "tsc"` and `"main": "dist/index.js"`).
2. Build and start: `npm ci`, `npm run build`, `npm start`. The `postinstall` script runs `prisma generate` automatically.
3. Set these environment variables on the host: `NODE_ENV=production`, `PORT` (as the host requires), `DATABASE_URL`, `JWT_SECRET`, `TOTP_ENCRYPTION_KEY`, `FRONTEND_ORIGIN` (your website's exact address, e.g. `https://www.yourshop.ph`), `TRUST_PROXY=1`, the `CLOUDINARY_*`, `SMTP_*`, `MAIL_FROM`, `CONTACT_INBOX` values, `ORDER_HOLD_HOURS` (default 24).
4. Run only **one** API instance for now. The rate limits and the 5-minute cleanup job keep their state in memory; to run several instances, move the rate-limit counters to Redis first.

### D5. Run the website
1. Deploy `frontend/` (any Next.js host; e.g. Vercel). Set `NEXT_PUBLIC_API_URL` to the API's public address and make sure the build can reach the API (the root layout fetches products and content on the server).
2. Set `SITE_URL` in `frontend/library/siteConfig.ts` to the real domain (used for the sitemap and metadata).

### D6. Make the login cookies work across your two addresses
The site and the API need a **shared parent domain**, e.g. `www.yourshop.ph` (site) and `api.yourshop.ph` (API). This needs one code change that isn't in the project yet:
1. In `backend/src/lib/jwt.ts`, add a `domain` to `cookieOptions`: `domain: process.env.COOKIE_DOMAIN || undefined,` and set `COOKIE_DOMAIN=.yourshop.ph` in production. (`clearAuthCookie` already reuses the same options, so logout will clear it correctly.)
2. Without this, the API sets the cookie only for `api.yourshop.ph`, the website at `www.yourshop.ph` never sees it, and `frontend/proxy.ts` will think every admin is signed out.
3. Test on the real domains: sign in as admin, open `/admin/dashboard`, reload, and confirm you stay signed in; sign in as a customer and confirm My Purchase loads.

### D7. Payment operations (no gateway — this is a procedure, so write it down)
1. In Admin → Settings → Payment Details, enter the **real** accounts. Only Administrators can edit this; every change is logged with the numbers.
2. Decide who reviews screenshots, how fast (say so on the site, e.g. "within 1 business day"), and what counts as a match: right **amount**, right **account**, and a payment that actually shows in the GCash/Maya/bank app — not just in the picture.
3. Decide how long unpaid orders are held. `ORDER_HOLD_HOURS` is 24 by default; set it to 48 on the API host if your customers are slow to pay. Remember the stock stays reserved for that long.
4. Do one small real purchase end to end (pay, upload, approve) before announcing, then refund yourself manually.
5. Reconcile once a day: orders marked Paid against your GCash/bank statement.
6. Keep records as your bookkeeping and tax rules require.

### D8. Email deliverability
1. Use a transactional email provider (or your host's SMTP) with a sender on your own domain.
2. Add the SPF and DKIM records the provider gives you to your DNS, then send test mails to a Gmail and an Outlook address and confirm they reach the inbox, not spam.

### D9. Monitoring
1. Uptime: point a free uptime monitor at `https://api.yourshop.ph/health` (expects `{"ok":true}`) with an alert to your phone/email.
2. Errors: add an error-reporting service (e.g. Sentry) to both apps; the API's catch-all handler in `backend/src/app.ts` is where unexpected errors are logged today.
3. Logs: search the API logs regularly for `[mail] send failed` and `[orders]` lines (automatic cancellations).

### D10. Launch check
- [ ] Repeat the whole Part B1 browser pass against the live site with a real (small) order.
- [ ] Place an order, pay it, ship it and deliver it from admin; confirm the History section and the emails.
- [ ] Confirm the old test passwords no longer work, 2FA is on for every administrator, and `/audit-log` shows your own actions.
- [ ] Write down where the secrets, backups and the Cloudinary / email / GCash-bank logins are kept, and who has access.

---

## Handy commands (all in `backend/` unless noted)

| What | Command |
|---|---|
| Run the API | `npm run dev` |
| Type-check | `npm run typecheck` (frontend: `npx tsc --noEmit` in `frontend/`) |
| Look at the database | `npx prisma studio` |
| Apply database changes | `npx prisma migrate deploy` (production) / `npx prisma migrate dev` (development) |
| Reload the sample products | `npm run seed-products` |
| Create a staff login | `npm run create-staff -- <email> <password> "<name>" ADMINISTRATOR` |
