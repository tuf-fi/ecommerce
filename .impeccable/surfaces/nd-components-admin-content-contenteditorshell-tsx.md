---
version: 1
slug: "nd-components-admin-content-contenteditorshell-tsx"
primary_target: "frontend/components/admin/content/ContentEditorShell.tsx"
related_targets: ["frontend/components/admin/content/HeroEditor.tsx","frontend/components/admin/content/AboutEditor.tsx","frontend/components/admin/content/PageIntroEditor.tsx","frontend/components/admin/content/PhilosophyEditor.tsx","frontend/components/admin/content/CatalogueEditor.tsx","frontend/components/admin/content/NewsletterEditor.tsx","frontend/components/admin/content/PageContentEditor.tsx","frontend/app/admin/(panel)/content/blog/[id]/page.tsx","frontend/app/admin/(panel)/content/promotions/[id]/page.tsx"]
---

## Direction contract

THESIS: Replace the stacked "preview-then-form" single column with a WordPress-editor topology — one center column (title, live preview, main fields) plus a persistent right rail of flat metaboxes (Publish, Featured Image, Details) — so status/save/meta are always visible, never scrolled past.

OWN-WORLD: Inherits Cindyrella admin's existing tokens untouched — navy/ink/pink-btn, Space Grotesk display, Inter body, IBM Plex Mono uppercase mono labels, flat hairline-bordered white surfaces, no shadows/rounding, no glassmorphism. Rail metaboxes are the same flat-bordered-box language as the center column, each with a mono uppercase header strip (`bg-off/50` divider), stacked with gaps — never nested cards-in-cards.

STORY: An editor lands on the page, sees status (draft/last-saved) and the Save action immediately in the rail without scrolling, edits the title/preview/fields in the center at full width, and — for editors with one — sets a featured image or secondary details (status, visibility) from their own rail metabox.

FIRST VIEWPORT: Desktop: two-column grid, center `minmax(0,1fr)`, rail fixed ~300px, rail sticky under the topbar. Center: title header bar, then live preview pane, then form fields below at full column width. Rail top-to-bottom: PUBLISH box (status line + full-width Save button), FEATURED IMAGE box (editors that have one: Hero/Blog/Promo), DETAILS box (editors that have one: Blog status, Promo visibility). Below `lg`, rail stacks under center, full width, Publish box's Save button still reachable without a floating bar.

FORM: Extend existing surface (ContentEditorShell + its 9 single-entity editors) — precisely specified structural change on an established brand world; no concept-seed roll.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
