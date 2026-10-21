# Cindyrella: admin access and security

How staff reach the admin, and how it is kept away from everyone else.

## How it works

- **`/admin` shows "not found" to anyone who isn't signed in.** That includes `/admin/login`, `/admin/dashboard` and every other `/admin/...` address. A visitor who types it sees the shop's normal 404 page and no login form.
- **Staff sign in at a private address** that is not under `/admin`. By default this is `/staff-access` (so `http://localhost:3000/staff-access` while developing).
- **Signed-in staff** who visit the private address go straight to the dashboard.
- **The API checks the login too.** Admin data (orders, customers, discount codes, subscribers, audit log) answers `401 Unauthorized` without a valid staff login, whatever page the request comes from.
- **Hiding the sign-in page is not the lock.** The lock is the password, optional two-factor, and the sign-in rate limits. The private address just means casual visitors never see the form. Anyone you tell the address to can see it.

## Signing in (staff)

1. Open the private address (ask an administrator for it; there is no link to it on the site).
2. Enter your **staff** email and password. Customer accounts do not work here.
3. If two-factor is on for your account, enter the 6-digit code from your authenticator app.
4. You land on the dashboard and stay signed in on that device. Administrators can see and sign out other devices in **Settings → Sessions**.

## Change the private address (do this before launch)

The default `/staff-access` is written in the code, so treat it as a placeholder.

1. In `frontend/.env.local` add:

   ```
   NEXT_PUBLIC_ADMIN_LOGIN_PATH=/your-private-path
   ```

   It must start with `/`. Pick something only your team knows.
2. Restart the frontend (`npm run dev` / redeploy). The setting is read when the site starts.
3. Tell your staff the new address. Update any bookmarks.

Where it lives in the code: `frontend/library/adminPaths.ts` (the setting), `frontend/next.config.ts` (serves the sign-in page at that address) and `frontend/proxy.ts` (shows "not found" for `/admin/...` when signed out).

## Accounts and roles

- **Administrator** can use everything. **Staff** can use only the sections they were given; "Full access" covers everything except the administrator-only sections (such as the audit log).
- Administrators add and deactivate staff in **Staff & Roles**.
- Create an account from the command line, in `backend/`:

  ```
  npm run create-staff -- <email> <password> "<name>" [ADMINISTRATOR|STAFF]
  ```
- A deactivated account can no longer sign in.

## Before going live

1. **Delete the test accounts** `admin@cindyrella.test` and `staff@cindyrella.test`. Their passwords are written in `NEXT_STEPS.md`. Create real accounts with strong, unique passwords.
2. **Turn on two-factor for every administrator.** It is optional today.
3. **Generate fresh secret keys** for the live server (`JWT_SECRET` and the other secrets in `backend/.env`). Do not reuse the development ones.
4. **Use HTTPS on real domains**, with the shop and API under one parent domain (for example `www.yourshop.ph` and `api.yourshop.ph`), `COOKIE_DOMAIN=.yourshop.ph` on the API, and `FRONTEND_ORIGIN` set to the shop address. Without this, admins look signed out on the live site.
5. **Change the private sign-in address** (see above).
6. **Optionally restrict by network.** If only a few people use the admin, limit `/admin` and the admin API to their IP addresses, or put it behind a VPN or Cloudflare Access.
7. **Give staff only the access they need.** Keep "Full access" for as few people as possible.

## Already in place

- Admin pages are blocked at the server before any admin code reaches the browser.
- The login cookie is `httpOnly` (page scripts cannot read it) and `secure` in production.
- Sign-in attempts are rate-limited per account and per address.
- Optional two-factor (authenticator app) with recovery codes.
- Every sign-in is a session administrators can list and sign out (Settings → Sessions).
- Admin changes are recorded in the audit log.

## Not built yet (ideas)

- Require two-factor for administrators instead of making it optional.
- Temporary lockout after repeated failed admin sign-ins, and an email to the owner on a sign-in from a new device.
