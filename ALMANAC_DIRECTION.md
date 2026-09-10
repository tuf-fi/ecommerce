# Cindyrella Almanac — Direction Proposal

Status: **plan only, no code changed.** This branch (`impeccable-test`) exists to hold this
proposal for review before any implementation starts. Visual version of this document (palette
swatches, type specimens, page mockups): https://claude.ai/code/artifact/3003312b-cff6-4dfc-b720-41f3506cfc75

## Brief this answers

"If you were building Cindyrella's site with no existing UI/UX, how would you build it?" — scoped
to the **full customer-facing site** (Home, Shop/PDP, Cart, Account, Journal, Rituals; admin panel
out of scope, it already has its own Impeccable pass), with a **genuinely new visual direction**
(not constrained by the current build's tokens/editorial-gallery language), and **no Testimonials
section**.

## Thesis

The current build's differentiator is "calm and editorial where competitors are cramped" —
delivered as a design-studio-portfolio language (numbered sections, mono eyebrows, gallery
whitespace). This proposal keeps the same calm-and-considered instinct but grounds it in a fact
`PRODUCT.md` already states: Cindyrella is Philippines-based and its shoppers are research-driven,
not impulse buyers. So the site is framed as a **field almanac for tropical skin** — humidity, UV
load, and monsoon dryness treated as named forces the product line answers. Instrument-style
readout strips (humidity %, UV index, SPF/PA, pH, batch) become the structural device in place of
`01 — Section Title ————`.

No fabricated evidence: any climate figures shown are illustrative placeholders for a device that
would pull from a real climate API or static seasonal copy in production — per `PRODUCT.md`'s "no
case studies/benchmarks on hand, don't fabricate."

## Palette

| Token | Hex | Role |
|---|---|---|
| Paper | `#E7E9E1` | base ground |
| Ink Storm | `#16252A` | text, dark bands |
| Mineral Teal | `#3C6B62` | structure, links |
| Teal Pale | `#D9E4DD` | tinted panels |
| Papaya | `#DD5C2C` | the one CTA/accent color |
| Amber Trace | `#AD7E2C` | ratings only, never a general accent |

## Type

- **Instrument Serif** — display/manifesto voice
- **Work Sans** — body/UI copy
- **JetBrains Mono** — anything measured: prices, actives, SPF/PA, pH, batch codes, dates

## Motion

Same standing rule as the current codebase, generalized: **statement/manifesto bands (this
brand's Philosophy-equivalent, Contact, Newsletter, Footer) stay fully static — no scroll-triggered
reveal.** Hero gets one on-load entrance sequence only. Product grids animate on hover only. Readout
strips count up once on first paint, not on every scroll into view.

## Sitemap (customer-facing only)

1. **Home** — Hero, The Climate Argument, Shop by Concern, Field-Tested (best sellers), Rituals
   teaser, Journal preview, Newsletter, Footer
2. **Shop / PDP** — concern + climate-condition filters, result grid, product detail, routine
   pairing
3. **Cart** — line items, order summary rail, mobile checkout bar
4. **Account** — Profile, Addresses, Password, Purchases (+ tracking), Notifications, Vouchers, Help
5. **Journal** — featured post, category list, article + share rail
6. **Rituals** — routine list, sequential steps, running-total rail

## Homepage — section by section

1. **Hero** — full-bleed photo showing humidity/condensation in-shot, thesis headline, Papaya CTA,
   readout strip under the fold (sets up section 2).
2. **The Climate Argument** — Ink Storm band, Instrument Serif thesis. Static, no reveal motion.
3. **Shop by Concern** — retagged around climate response: Barrier Repair, Oil Balance, Sun
   Defense, Hydration Reserve. Full-bleed photo tiles, bottom-scrim captions, centered row.
4. **Field-Tested** — best sellers, asymmetric grid (one lead product larger), mono readout per
   card (key active + SPF/PA) instead of a star rating up front.
5. **Rituals teaser** — spotlight one AM/PM routine, links to the full Rituals page.
6. **Journal preview** — featured article + two supporting cards (ingredient/climate-care guides).
7. ~~**Testimonials**~~ — **removed per brief.** No section substituted in its place; the page
   runs one section shorter. There's also no review/case-study data on hand to build one honestly.
8. **Newsletter** — static band, "Join the Almanac," no decorative star row.
9. **Footer** — Ink Storm, static.

## Shop, PDP, Cart, Account, Journal, Rituals

Full page-by-page notes (filter rail redesign, the PDP "Instrument Panel" block, account nav
active-state treatment, Rituals' AM/PM step tags, etc.) are written out in the visual version
linked above — kept there rather than duplicated in full here since they're easier to follow next
to the actual mockups.

## Scope note

This branch currently holds this document only. If the direction is approved, implementing it
touches: Tailwind tokens (new color/font scale), the shared `Card`/`PageIntro`/`SectionTitle`
primitives, and every customer route listed in the sitemap above. Admin panel is untouched. Given
the surface area, a real build would be multi-session, homepage first as the proving ground.
