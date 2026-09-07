# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Filipino skincare shoppers making a considered purchase, not an impulse buy — they research ingredients and reviews before deciding. A secondary audience buys curated sets as gifts, where presentation and brand story matter more than ingredient-level detail.

## Product Purpose

Cindyrella is a PH-based skincare ecommerce platform: browse/shop products, read editorial "journal" content, and buy through a full cart/checkout flow, with a companion admin panel (orders, inventory, staff, content/CMS) run by the business.

## Positioning

Mainly a design-led experience: most PH skincare ecommerce sites are visually cramped and component-dense ("hard on the eyes," per the user), so an editorial, architectural, breathing-room presentation (closer to a design studio portfolio than a typical store template) is itself a meaningful differentiator, alongside the brand's own product story.

## Operating Context

- Customer surfaces: homepage (numbered editorial sections incl. Philosophy, Best Sellers/Catalogue), shop/PDP, cart/checkout, account (addresses, password, purchases, notifications), wishlist, journal (blog).
- Admin surfaces: dashboard, orders, inventory (incl. stock movement log), staff, content/CMS (blog, pages, promotions, hero), settings (incl. sessions, notifications), with Administrator vs Staff roles as a data field.
- Payments via PayMongo (GCash, Maya, cards); media via Cloudinary; auth via JWT + httpOnly cookies with separate customer/admin roles.

## Capabilities and Constraints

- Stack: Next.js (App Router) + TypeScript + Tailwind frontend; Node/Express API backend; PostgreSQL + Prisma.
- RBAC is not yet enforced — `StaffMember.role` exists as data but no page/action checks it (flagged in `frontend/TODO.md`, open).
- Audit trail currently covers inventory stock movements only; order status, staff, and content-edit history are not logged.
- Admin settings security features (password change, 2FA enrollment) are intentionally faked placeholders (`// TODO`) pending go-live.
- CMS content wiring is in progress: homepage sections are being connected to `useContent()` + admin live preview; not all sections are wired yet.

## Brand Commitments

- Name: Cindyrella.
- Visual reference: editorial/architectural, closer to a design studio portfolio (e.g. kononenkogroup.com) than a typical ecommerce template — numbered section labels, typography-led hierarchy, generous whitespace, flat surfaces (hairline borders, no heavy shadows/gradients-as-decoration), confident/dry editorial copy voice.
- Three-color brand identity: deep saturated blue (`ink`/`navy`), rose/berry pink (accents/CTAs), warm gold (ratings/reviews only) — each color has a distinct job and none should crowd out the others.
- No liquid glass/glassmorphism on product-facing UI (scoped exceptions only: scrolled nav bar, modal/drawer overlay dims).
- Fonts: Space Grotesk (display/headings), Inter (body), IBM Plex Mono (labels/eyebrows/prices).

## Evidence on Hand

No case studies, testimonials, press, or benchmark data on hand — do not fabricate any. Design tokens are real and defined in `frontend/tailwind.config.ts`.

## Product Principles

- Considered-purchase shopping deserves a calm, uncluttered reading experience over dense, component-heavy store conventions.
- Every screen should look like it belongs to this brand specifically, not an interchangeable SaaS/ecommerce template.
- Typography and whitespace carry hierarchy; decoration stays minimal.
- Match the tone/structure of the closest existing screen rather than inventing new patterns when a screen is unspecified.
