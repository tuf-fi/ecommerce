# Remaining Work — Cindyrella

Last updated 2026-10-14. Details and how-to for each item are in `NEXT_STEPS.md`. Tick boxes as you go.

## 1. Prove it works (needs you, no new code)
- [ ] Browser pass over the customer and admin flows (B1). None of the frontend has been clicked through yet.
- [ ] Manual payment run: upload a screenshot, reject it, upload again, approve it (B2).
- [ ] Cloudinary: create the account, add the keys, upload a photo and confirm it shows on the product page (B3).
- [ ] Real email: set up SMTP (Brevo, port 2525) and confirm emails arrive (B4).

## 2. Launch setup (needs your accounts and domain)
- [ ] Fresh secrets, including a separate `TOTP_ENCRYPTION_KEY` (D1).
- [ ] Real administrators with 2FA on; delete the test accounts (D2).
- [ ] Managed Postgres with backups, and a restore you have practised (D3).
- [ ] Deploy the API and the site; set the environment variables from D4 and D5.
- [ ] One parent domain for the site and API, `COOKIE_DOMAIN` set, login tested on the real domains (D6).
- [ ] Written payment-review procedure (D7).
- [ ] SPF and DKIM records for email (D8).
- [ ] Uptime monitor and error reporting (D9).
- [ ] Final small real order, then refund yourself (D10).

## 3. Code work
Done in the 2026-10-14 audit: `start` script, `COOKIE_DOMAIN`, `helmet`, Cloudinary `remotePatterns`, duplicate Prisma config removed.

Payment safeguards (C7), built 2026-10-14 (set `PROOF_APPROVER_MIN_TOTAL` if you want the large-order limit; try them in the browser):
- [x] Duplicate-reference warning
- [x] Amount and sender name on the screenshot upload, with a mismatch highlight
- [x] "Payments to review" count badge on the Orders menu
- [x] 90-day screenshot cleanup
- [x] Administrator-only approval for large orders
- [x] Resize and strip metadata from screenshots (`sharp`)

Other:
- [x] CMS edit-conflict protection
- [ ] Server-side dashboard stats (deliberately left: the dashboard cards, charts and "latest day" logic all depend on the loaded order list, and changing it without checking in a browser risks breaking numbers; only matters past about 2,000 orders)
- [x] Save the city on the order
- [x] Email retries
- [x] Graceful shutdown
- [x] Automated tests for orders, stock and vouchers (`npm test`, 15 tests, own `cindyrella_test` database)

## 4. Future improvements
- [ ] Mobile number check by SMS code (OTP). Today the number is only checked for format (Philippine mobile, `09XXXXXXXXX`; see `backend/src/lib/phone.ts` and `frontend/library/phone.ts`), so a wrong but valid-looking number gets through. Plan:
  - A text-message code costs money per SMS (roughly ₱0.50–1 with Semaphore; check current rates). Email codes can't do this, since they only prove the inbox, not the phone.
  - Build the flow with one swappable `sendSms(to, text)` function; in development it logs the code to the server console. Then plug in a provider (Semaphore recommended; Twilio trials can only text pre-verified numbers) and add its API key.
  - Reuse the `OtpCode` model and rate limiting from the email reset flow. Limit code requests per number and per customer so nobody can run up the SMS bill.
  - Add `Customer.phoneVerifiedAt`; clear it whenever the number changes. Profile page shows a Verified badge and a "Send code" step.
  - Only enforce "verified number required to order" once an SMS provider is configured, otherwise every order would be blocked.
