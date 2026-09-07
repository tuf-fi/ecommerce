# CLAUDE.md — Cindyrella Ecommerce

## Design Rules (read first, apply to every UI task)

0. **Use the `impeccable` skill for design work.** It's installed at `.claude/skills/impeccable` (repo root) with durable context in `PRODUCT.md` (repo root). For any non-trivial UI task — new screens, redesigns, or a pre-ship pass — reach for its commands (`/impeccable polish`, `critique`, `audit`, `distill`, `typeset`, etc.) rather than working ad hoc; it enforces rules 1–4 below programmatically (anti-slop detection, quality floor) on top of this brand's own direction. Run `/impeccable document` once to generate `DESIGN.md` from the tokens below when a portable, tool-readable copy of this design system is needed.
1. **Use the frontend-design skill** for any component, page, or layout work — before writing markup, check it for design tokens/patterns to follow.
2. **Avoid generic AI design patterns.** No default shadcn-card-with-shadow layouts, no centered-hero-with-three-feature-cards clichés, no interchangeable SaaS-template flows. Every screen should look like it belongs to *this* brand, not a template.
3. **Avoid AI slop.** No filler copy ("Discover our amazing products"), no lorem-ipsum-adjacent placeholder text left in, no inconsistent spacing/sizing "close enough" to the design system, no unnecessary emoji, no over-explained UI (excess tooltips/labels stating the obvious).
4. **No liquid glass / glassmorphism on product-facing UI.** No `backdrop-filter: blur()`, frosted panels, or translucent layering on product cards, checkout, prices, or CTAs — it fights readability and conflicts with the flat/editorial direction below. **Scoped exception:** a subtle blur is allowed only on (a) the nav bar background once the user scrolls, and (b) the dim/blur behind modal and drawer overlays. Nothing else.

If a screen isn't specified below, **match the tone and structure of the closest existing one** rather than inventing a new pattern.

---

## What This Is

Cindyrella is a PH-based skincare ecommerce platform. `README.md` has the phase order, data model, and architecture decisions.

## Visual Direction

The reference language is **editorial and architectural**, closer to a design studio's portfolio site (see: kononenkogroup.com) than a typical ecommerce template. Screenshots of the target look will be provided alongside this file — match them closely, not loosely.

Key traits to reproduce:

- **Numbered section labels** — every major section is introduced with an index + title + thin horizontal rule (e.g. `01 — About ————————`), not a plain heading
- **Typography does the heavy lifting.** Large, confident display headlines carry the hierarchy; decoration is minimal. Small mono-spaced labels (eyebrows, prices, metadata) contrast against large serif/sans display type for headlines
- **Generous, deliberate whitespace** — sections breathe, nothing feels cramped or "boxed in." Negative space is a design choice, not empty leftover space
- **Flat, restrained surfaces** — hairline borders instead of heavy drop shadows, no bubbly rounded SaaS cards, no gradients as decoration (gradients are fine as a real background treatment, not glued onto every card)
- **Mostly neutral/light base** with the brand's soft pastel accents used sparingly and intentionally, plus at least one high-contrast dark section (nav/footer/contact-style) to ground the palette
- **Photography-led where it matters** — product/lifestyle imagery gets to be large and uncropped-feeling, not squeezed into uniform thumbnail grids everywhere
- **Confident, editorial copy voice** — short, direct, a little dry. Not enthusiastic marketing-speak.
- **No visible scrollbars inside modals/drawers.** If content overflows, it should still scroll (never trap content or cut it off) but the scrollbar itself stays hidden — `scrollbar-width: none` (Firefox) + `::-webkit-scrollbar { display: none }` (Chrome/Safari/Edge) on the scrolling container. Applies to all modals, drawers, and dropdown panels.

---

## Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind
- **Backend:** Node/Express API, separate from the Next.js app
- **DB:** PostgreSQL + Prisma
- **Payments:** PayMongo (GCash, Maya, cards)
- **Media:** Cloudinary
- **Auth:** JWT + httpOnly cookies, separate customer/admin roles

## Design Tokens

Defined in `tailwind.config.ts` — always use these, never hardcode hex values that already have a token:

Brand identity runs on three colors: a deep saturated **blue** (`ink`/`navy`), a rose/berry **pink** (accents, CTAs), and a warm **gold** (ratings, review stars). Don't let any one of them crowd out the others — pink is not a stand-in for gold, and vice versa.

| Token | Value | Use |
|---|---|---|
| `ink` | `#12233A` | body text — deep saturated blue, **not literally black** |
| `navy` | `#0F2036` | fixed solid dark surfaces (scrolled nav, Philosophy band, dark buttons/icons) — pairs with white text, never flips |
| `footer` | `#1B1230` | the footer only — deliberately distinct from `navy` so the translucent scrolled navbar still reads as glass on top of it |
| `pink-btn` / `pink-btn-hover` | `#BA2556` / `#A61146` | primary buttons/CTAs only |
| `pink` / `pink-dark` / `pink-soft` | — | badges, accents, light backgrounds |
| `blue-soft` | `#E3F1F8` | light backgrounds, paired with `pink-soft` |
| `gold` | `#B07C2E` | star ratings/reviews only — the third brand color, not a general-purpose accent, **no `-soft` background variant** |
| `grey` / `grey-light` | — | secondary text, dark-surface captions |
| `success` | `#5FAE7D` | confirmation states only |

Fonts: `font-display` (Space Grotesk, headings), `font-body` (Inter, everything else), `font-mono` (IBM Plex Mono, labels/eyebrows/prices).

---

## Working Rules

- **Verify before moving on.** After any non-trivial change, actually check it (run it, read the diff) before starting the next task. Silent breakage compounds.
- **One feature per commit.** Small, reviewable commits — not "end of day" mega-commits.
- **No placeholder logic left unmarked.** If something's faked/stubbed (fake payment success, fake email sent), leave a `// TODO:` explaining what needs to become real.
- **Ask before deviating from the visual direction above**, even if you think you have a better idea — confirm before introducing a new pattern.

## Interaction Rules (apply to every page/flow)

1. **Scroll to top on navigation.** Every route change lands at the very top of the new page — handled globally by `components/layout/ScrollToTop.tsx` (mounted in `app/layout.tsx`), which resets scroll on `pathname` change. **Exception:** in-page section scrolling — Navbar's `goToSection` (clicking a navlink like "Best Sellers") — is untouched; it either calls `scrollIntoView`/`window.scrollTo` directly (no route change) or routes to `/#id` cross-page, and `ScrollToTop` skips its own reset whenever the URL carries a hash so the browser/Next can land on the section instead of the top.
2. **Confirm before delete/remove.** Any destructive "Remove"/"Delete" action must go through `components/ui/ConfirmModal.tsx` (wraps `components/ui/Modal.tsx`) — set local state on click, only call the actual mutation (`removeLine`, `removeAddress`, etc.) from the modal's `onConfirm`. See `app/cart/page.tsx` and `app/account/addresses/page.tsx` for the pattern. **Exception:** low-stakes toggles that are trivially reversible by re-clicking (e.g. the wishlist heart) don't need this — it's for one-way "this item is gone" actions.
