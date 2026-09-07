# Impeccable Design/UX Tasks

Tracks the findings from the `/impeccable critique` pass run on 2026-09-07 across the
customer and admin flows. Full reports: `.impeccable/critique/2026-09-07T00-48-54Z__customer-flow.md`
and `...__admin-flow.md`. Update this file as items get picked up — check them off, don't delete them,
so the history stays visible.

---

## Admin Flow — 26/40 (Acceptable)

Everything found is now applied except one blocked item and one intentionally-deferred stub
(both noted under Open below). Re-run `/impeccable critique` on this flow to get an updated score.

### Done

- [x] **[P0] Content editor Save/Discard was fiction.** Hero/About/Philosophy/Newsletter/PageIntro/
      Catalogue/Contact/Social-Links editors now stage drafts locally and only push to the live
      shared content on Save; Discard actually discards. Live preview still updates via a new
      `previewData` prop on the section components.
- [x] **[P1] No confirmation on order status changes.** Changing an order to "Cancelled" in
      `OrderModal.tsx` now requires confirmation via `ConfirmModal`.
- [x] **[P1] Staff deletion had no last-admin guard.** `adminStore.tsx`'s `deleteStaff` now blocks
      deleting the last remaining Administrator, with a toast explaining why.
- [x] **[P1] Systemic accessibility gaps.** Real `focus-visible` rings added sitewide (was
      `outline-none`-only via `formClasses.ts`), `htmlFor`/`id` pairs added across ~15 previously
      unlabeled forms, keyboard operability (`role`, `tabIndex`, `onKeyDown`) added to 5 mouse-only
      table rows, `scope="col"` added to every admin table header, Escape-key + `aria-expanded`/
      `aria-haspopup` added to the topbar's notification/profile dropdowns.
- [x] **[P2] No bulk actions or keyboard shortcuts anywhere in the panel.** Orders/Inventory/Staff
      tables now have a checkbox column + shared `BulkActionBar` (`components/admin/BulkActionBar.tsx`):
      Orders gets bulk status update (with confirm on bulk-Cancel) + CSV export; Inventory gets bulk
      delete + CSV export, and its toolbar Import/Export buttons are wired (Export now does a real
      CSV download of the filtered list, Import shows an honest "not wired up yet" toast instead of
      doing nothing); Staff gets bulk delete (respecting the last-Administrator guard). `"/"` now
      focuses the page's search field from anywhere (`SearchField.tsx`), and `"n"` triggers "+ Add"
      on Staff (Inventory already had click-to-add; add "n" there too if it's ever revisited).
- [x] **[Minor] Notification Preferences page doesn't persist and gives no feedback.** Now has a
      `// TODO: persist to backend` comment and toasts "Preference updated (demo only — not saved
      yet)" on every toggle, so a click is no longer silent either way.
- [x] **[Minor] Collapsed sidebar uses a native `title` tooltip** — now uses the shared `Tooltip`
      component like every other icon-only affordance in the panel.
- [x] **[Minor] `PagesTab.tsx`'s non-editable "Best Sellers" row** now shows a muted name plus a
      "No editor" `StatusBadge` so it's obvious without clicking.
- [x] **[Minor] `useAsyncAction.ts` simulates a fixed 700ms delay** — now has an explicit `// TODO`
      flagging it as demo-only and due for removal once real API calls exist (delay itself
      unchanged, this was a documentation-only fix).

### Open

- [ ] **[P1, blocked] Staff self-deletion guard not implemented.** Couldn't be added — the mock
      admin auth (`LoginForm.tsx`) accepts any email/password and never links the logged-in session
      to a real `StaffMember.id`, so there's no identity to compare against. Needs real admin auth
      (ties into the already-open RBAC gap in `frontend/TODO.md`) before this can be enforced.
      Currently only the last-Administrator guard is live.
- [ ] **[Follow-up] Inventory's real Excel import/export is still a stub.** The bulk/toolbar CSV
      export above is real, but full Excel-format import (parse + validate rows into products) is
      still just the pre-existing `// TODO` — a bigger, riskier feature intentionally left alone.

---

## Customer Flow — 29/40 (Good)

Nothing from this flow has been applied yet.

- [ ] **[P0] Checkout is a dead end.** `app/cart/page.tsx:172-177,195-200` — "Proceed to Payment"
      only toasts that checkout isn't wired up. Full fix is backend-dependent (payment
      integration), but the UI itself can stop pretending to be a working CTA in the meantime —
      style/label it as visibly unfinished (e.g. disabled state or "Coming Soon") instead of an
      identical primary button. Suggested: `/impeccable harden`.
- [ ] **[P1] Login gate loses the user's original action.** `components/ui/Card.tsx:13-19`,
      `components/sections/BestSellers.tsx:53-60`, `library/store.tsx:87-93` — after signing in
      via the forced `LoginModal`, the original add-to-cart/wishlist click is never replayed.
      Suggested: `/impeccable harden`.
- [ ] **[P1] No state persistence.** `library/store.tsx`'s `StoreProvider` holds cart/wishlist/
      login in plain `useState` with no localStorage/cookie backing — any refresh silently wipes
      the session. Suggested: `/impeccable harden`.
- [ ] **[P1] Sitewide form/control accessibility gaps.** No `htmlFor` on any customer-facing form
      label (Contact, Login/Signup, account profile, password change); two wishlist-toggle
      controls (`Card.tsx`, `BestSellers.tsx`) are `<span role="button">` with no `tabIndex`/
      `onKeyDown`, so they're not keyboard-operable at all; several primary touch targets (Navbar
      icons at 36px, wishlist toggle at 32px, PDP qty stepper ~32px) render under the ~44px
      guideline the cart page itself correctly uses. Suggested: `/impeccable audit`.
- [ ] **[P2] Homepage catalogue filters are fully-styled but dead.**
      `components/sections/Catalogue.tsx:27-49` — Category/Price/Rating selects marked `// TODO`,
      visually indistinguishable from the working `/shop` filters. Suggested: `/impeccable harden`.
- [ ] **[Minor] Two divergent Privacy Policy implementations.** `app/account/privacy/page.tsx`
      hardcodes its own text; `app/pages/privacy-policy/page.tsx` is CMS-driven. Point the account
      sidebar link at the CMS-driven route and delete the hardcoded duplicate.
- [ ] **[Minor] Welcome promo modal fires on a flat 1.4s timer** regardless of engagement —
      interrupts the Hero headline before it's read. Gate on scroll depth or a longer dwell time
      instead.
- [ ] **[Minor] `account/notifications/page.tsx` toggles give no save confirmation**, unlike every
      other settings action in the app.
- [ ] **[Minor] Newsletter's decorative star row uses `text-gold`** outside a literal rating
      context — a mild stretch of the "gold = ratings only" brand rule.
- [ ] **[Minor] No `prefers-reduced-motion` handling** in any of the three shared motion
      primitives (`FadeIn`/`RevealIn`/`TypeReveal`) — affects every scroll-triggered animation on
      the homepage and PDP/journal reveals.

---

## Pre-existing, already-tracked gaps (not from this critique)

These were already flagged in `frontend/TODO.md` before this audit and are referenced above where
relevant, but are tracked there, not here — see that file for status:

- RBAC not enforced (`StaffMember.role` exists as data, nothing checks it)
- Audit trail covers only inventory stock movements, not orders/staff/content
- Admin settings password-change and 2FA are intentionally faked (`// TODO`)
- Admin forms are toast-only validation, no inline field errors, no unsaved-changes guard on
  modals besides the content editors fixed above
