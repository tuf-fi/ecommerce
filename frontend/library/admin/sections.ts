// Homepage regions the CMS can show/hide, plus their lookups — kept out of content.tsx so admin UI and customer chrome can import without pulling in the provider.

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

// Homepage render order (see app/page.tsx) — everything built off this reads top-to-bottom like the page.
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

// The real DOM id each section renders; several differ from their key, and Hero's empty string means "scroll to top", not an element lookup.
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

// Admin-facing names — mirrors the customer-visible heading where one exists, so the two lists read as the same thing.
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
