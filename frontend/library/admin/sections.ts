// The twelve homepage regions that can be shown/hidden from the CMS, plus the
// two lookups every consumer of that list needs. Lives here rather than in
// content.tsx so the anchor/label maps and the key union they're keyed by
// can't drift apart, and so admin UI (PagesTab, LinksTab) and customer chrome
// (Navbar) can import them without pulling in the provider.
// `SectionKey` is re-exported from library/content.tsx for call sites that
// already read everything else from there.

export type SectionKey =
    | "hero"
    | "about"
    | "bestSellers"
    | "moments"
    | "philosophy"
    | "glossary"
    | "catalogue"
    | "journal"
    | "faq"
    | "testimonials"
    | "contact"
    | "newsletter";

// Homepage render order (see app/page.tsx) — every list built off this reads
// top-to-bottom the way the page itself does.
export const SECTION_KEYS: SectionKey[] = [
    "hero",
    "about",
    "bestSellers",
    "moments",
    "philosophy",
    "glossary",
    "catalogue",
    "journal",
    "faq",
    "testimonials",
    "contact",
    "newsletter",
];

// The real DOM id each section renders (`<SectionContainer id="…">`), which is
// what Navbar's smooth-scroll and every `/#…` link actually target. Several
// don't match their key: the sections were named for what they contain
// ("Moments" of a routine) while the anchors were named for what the customer
// sees ("Rituals"). Hero has no id at all — it's the top of the page, so an
// empty string here means "scroll to top" rather than "look up an element".
export const SECTION_ANCHOR_ID: Record<SectionKey, string> = {
    hero: "",
    about: "about",
    bestSellers: "bestsellers",
    moments: "rituals",
    philosophy: "philosophy",
    glossary: "concern",
    catalogue: "products",
    journal: "journal",
    faq: "faq",
    testimonials: "testimonials",
    contact: "contact",
    newsletter: "newsletter",
};

// Admin-facing names — what an editor sees in the Pages list and the nav-link
// Section dropdown. Deliberately the customer-visible section heading where
// there is one ("Shop by Concern", not "Glossary") so the two lists are
// recognizably the same thing.
export const SECTION_LABELS: Record<SectionKey, string> = {
    hero: "Hero",
    about: "About",
    bestSellers: "Best Sellers",
    moments: "Rituals",
    philosophy: "Philosophy",
    glossary: "Shop by Concern",
    catalogue: "Shop All",
    journal: "Journal",
    faq: "FAQ",
    testimonials: "Testimonials",
    contact: "Contact",
    newsletter: "Newsletter",
};
