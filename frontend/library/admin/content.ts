import { journalImages, ritualImages, concernImages } from "@/components/ui/images";
import { faqs } from "../faq";
import { BlogPost, Concern, Faq, FooterLinkItem, Promo, Ritual, SiteNavLink, StaticPage, Testimonial } from "./types";
import { SECTION_KEYS, SectionKey } from "./sections";

// Blog posts don't store a slug — it's derived from the title so renaming a
// post can't leave a stale slug behind pointing at the old URL.
export function slugify(title: string) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export const HOMEPAGE_HERO_DEFAULT = {
    headline: "Skin, considered.",
    cta: "Shop the edit",
    subtext: "A quiet, considered approach to skincare — formulated with intent, not trend.",
    image: null as string | null,
};

export const ABOUT_DEFAULT = {
    founder: "2026",
    location: "Metro Manila, PH",
    focus: "Considered skincare, formulated in small batches",
    lead: "A studio built on restraint.",
    body: "Cindyrella is a considered skincare studio based in Metro Manila, built on the idea that a routine should be simple, effective, and honest about what's in it. We formulate in small batches, around fewer and better ingredients, and we'd rather make five products we believe in than fifty we don't.",
};

export const PROMOS: Promo[] = [
    {
        id: 1,
        text: "10% off your first order + free shipping on orders over ₱2,000",
        code: "RITUAL10",
        image: null,
        active: true,
    },
    {
        id: 2,
        text: "Buy the Ritual Edit set, get a travel-size cleanser free",
        code: "",
        image: null,
        active: false,
    },
];

export const STATIC_PAGES: StaticPage[] = [
    {
        id: 2,
        slug: "shipping-returns",
        name: "Shipping & Returns",
        category: "Support",
        updated: "Jul 30, 2026",
        content:
            "Orders ship within 1-2 business days. Metro Manila arrives in 2-4 days, provincial addresses in 5-7 days.\n\nUnopened items can be returned within 14 days of delivery for a full refund.",
    },
    {
        id: 3,
        slug: "privacy-policy",
        name: "Privacy Policy",
        category: "Security",
        updated: "Jun 18, 2026",
        content: "We collect only what's needed to process your order and never sell your data to third parties.",
    },
    {
        id: 4,
        slug: "terms",
        name: "Terms of Service",
        category: "Security",
        updated: "Jun 18, 2026",
        content: "By using cindyrella.ph, you agree to purchase for personal use and not for resale.",
    },
    {
        id: 5,
        slug: "faq",
        name: "FAQ",
        category: "Landing Page",
        updated: "Aug 20, 2026",
        content: "",
    },
];

// Default headline/accent shown atop the Shop, Wishlist, and Cart pages —
// editable from the admin's Pages tab (see PageIntroEditor) the same way the
// homepage Hero is, just without an image/CTA since these are listing pages.
export const PAGE_INTRO_DEFAULTS: Record<"shop" | "wishlist" | "cart" | "journal", { headline: string; accent: string }> = {
    shop: { headline: "Everything we make,", accent: "in one place." },
    wishlist: { headline: "Formulas you're", accent: "still thinking about." },
    cart: { headline: "Everything you're", accent: "taking home." },
    journal: { headline: "Notes on ingredients, routines,", accent: "and the thinking behind them." },
};

// Every section starts visible — this map only exists so an admin can switch
// one *off*, and a brand-new install should look exactly like the designed
// homepage. Built from SECTION_KEYS rather than written out by hand so adding
// a thirteenth section can't leave a hole here.
export const SECTION_VISIBILITY_DEFAULT: Record<SectionKey, boolean> = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, true])
) as Record<SectionKey, boolean>;

// The homepage Contact section's headline, split the same way the page-intro
// headlines are: a plain first line and an accented second one.
export const CONTACT_DEFAULT = {
    headline: "Let's",
    accent: "talk skin.",
};

// One plain string for the main line rather than a headline/accent pair — the
// original markup emphasized a single word mid-sentence, which no two-field
// split expresses honestly. The emphasis is dropped in exchange for the whole
// line being editable.
export const PHILOSOPHY_DEFAULT = {
    eyebrow: "N° 002 — Philosophy",
    headline: "Good skin isn't fixed overnight. It's the sum of small, consistent choices, applied with care.",
    subtext:
        "Every formula is built around fewer, better ingredients — layered in an order that actually works with your skin, not against it.",
};

// The Shop All section's only genuine editorial string — its filters and
// product grid are product data, not content.
export const CATALOGUE_DEFAULT = {
    ctaLabel: "Go to Shop",
};

export const NEWSLETTER_DEFAULT = {
    headline: "Join the",
    accent: "ritual.",
    body: "First access to new formulas, routine tips, and members-only offers — straight to your inbox.",
    socialProof: "Loved by 12,000+ skincare routines",
};

// Read by both the Contact section and the Footer, which each used to carry
// their own hardcoded copy of it.
export const CONTACT_INFO_DEFAULT = {
    email: "hello@cindyrella.ph",
    phone: "+63 917 000 0000",
    addressLine1: "Makati City,",
    addressLine2: "Metro Manila",
    hoursLine1: "Monday – Saturday",
    hoursLine2: "9am – 6pm",
};

// TODO: replace with real @cindyrella handles once the social accounts exist —
// "#" is the literal value both the Contact section and the Footer shipped
// with, i.e. a link that deliberately goes nowhere.
export const SOCIAL_LINKS_DEFAULT = {
    instagramUrl: "#",
    instagramEnabled: true,
    tiktokUrl: "#",
    tiktokEnabled: true,
    pinterestUrl: "#",
    pinterestEnabled: true,
    facebookUrl: "#",
    facebookEnabled: true,
    xUrl: "#",
    xEnabled: true,
};

// Seeded from the list Navbar.tsx actually rendered. "Home" isn't here: it
// duplicates the wordmark's scroll-to-top rather than pointing at a section,
// so it stays hardcoded in the navbar.
export const NAV_LINKS_DEFAULT: SiteNavLink[] = [
    { id: 1, label: "About", section: "about" },
    { id: 2, label: "Best Sellers", section: "bestSellers", group: "more" },
    { id: 3, label: "Rituals", section: "moments" },
    { id: 4, label: "Concern", section: "glossary" },
    { id: 5, label: "Products", section: "catalogue" },
    { id: 6, label: "Journal", section: "journal" },
    { id: 7, label: "FAQ", section: "faq", group: "more" },
    { id: 8, label: "Testimonials", section: "testimonials", group: "more" },
    { id: 9, label: "Contact", section: "contact", group: "more" },
];

// TODO: point these at real filtered listings once /shop reads a `?category=`
// param (it only reads `?concern=` today) — "#" is the value the footer
// shipped with for all five.
export const FOOTER_SHOP_LINKS_DEFAULT: FooterLinkItem[] = [
    { id: 1, label: "Serums", href: "#" },
    { id: 2, label: "Treatment", href: "#" },
    { id: 3, label: "Moisturizers", href: "#" },
    { id: 4, label: "Body", href: "#" },
    { id: 5, label: "Sets", href: "#" },
];

export const FOOTER_COMPANY_LINKS_DEFAULT: FooterLinkItem[] = [
    { id: 1, label: "About", href: "/#about" },
    { id: 2, label: "Journal", href: "/journal" },
    { id: 3, label: "Glossary", href: "/#concern" },
    { id: 4, label: "FAQ", href: "/#faq" },
    { id: 5, label: "Contact", href: "/#contact" },
    { id: 6, label: "Shipping & Returns", href: "/pages/shipping-returns" },
    { id: 7, label: "Privacy Policy", href: "/pages/privacy-policy" },
    { id: 8, label: "Terms of Service", href: "/pages/terms" },
];

// TODO: these are display-only badges until PayMongo is wired up — the real
// list should come from whichever methods the account actually has enabled.
export const FOOTER_PAYMENT_METHODS_DEFAULT: string[] = ["GCash", "Maya", "Visa", "Mastercard"];

const JOURNAL_TITLES = Object.keys(journalImages) as (keyof typeof journalImages)[];

export const BLOG_POSTS: BlogPost[] = [
    {
        id: 1,
        title: JOURNAL_TITLES[0] ?? "The Case for a Slower Routine",
        excerpt: "Why fewer, more deliberate steps beat a ten-part regimen — and how to tell which products are pulling weight.",
        content:
            "A ten-step routine sounds thorough. In practice, most of it is redundant — three different products fighting over the same job while the skin barrier absorbs the cost.\n\nThe products that earn a place in a slower routine share one trait: each does something the others can't. A cleanser that doesn't strip. A serum with one active, dosed properly. A moisturizer that actually seals it in. Everything else is a maybe, and a maybe doesn't belong on your skin every day.\n\nStart by removing, not adding. Cut anything you can't explain the purpose of in one sentence. What's left is usually the routine that was working all along, buried under everything else.",
        status: "Published",
        date: "Aug 18, 2026",
        image: journalImages[JOURNAL_TITLES[0]] ?? null,
    },
    {
        id: 2,
        title: JOURNAL_TITLES[1] ?? "Layering Order, Actually Explained",
        excerpt: "Thinnest to thickest is only half the rule. Here's what actually determines the order your products go on.",
        content:
            "\"Thinnest to thickest\" is the rule everyone repeats and almost nobody applies correctly, because texture is only a proxy for the thing that actually matters: how a formula is designed to penetrate.\n\nWater-based actives go first, while the skin can still absorb them directly. Oil-based and occlusive products go last, because their job is to sit on top and hold everything else in — reverse the order and you've built a barrier before the actives ever had a chance to get through it.\n\npH matters too. Some actives need a lower pH to work and get neutralized if they're layered under the wrong product. When in doubt, wait a few minutes between steps rather than stacking everything at once.",
        status: "Published",
        date: "Aug 5, 2026",
        image: journalImages[JOURNAL_TITLES[1]] ?? null,
    },
    {
        id: 3,
        title: JOURNAL_TITLES[2] ?? "What Niacinamide Can (and Can't) Fix",
        excerpt: "A clear-eyed look at what this ingredient actually does — and where the marketing gets ahead of the science.",
        content:
            "Niacinamide is one of the few actives with real evidence behind it — for barrier support, oil regulation, and mild tone-evening. That's genuinely useful, and it's also the entire list.\n\nIt will not shrink pores (nothing shrinks pores — they can look smaller when there's less oil sitting in them, which is different). It will not treat active cystic acne on its own. It will not replace SPF, retinoids, or a real exfoliation routine for texture.\n\nThe honest pitch for niacinamide is: a well-tolerated, low-risk ingredient that quietly supports everything else you're doing. Treat it as a supporting player, not a fix, and it earns its spot.",
        status: "Draft",
        date: "Aug 29, 2026",
        image: journalImages[JOURNAL_TITLES[2]] ?? null,
    },
    {
        id: 4,
        title: JOURNAL_TITLES[3] ?? "Six Weeks Into the Ritual Edit",
        excerpt: "One reader's real timeline using the full three-step set — texture, tone, and what changed when.",
        content:
            "Week one was mostly adjustment — a little tightness from the retinol serum, nothing dramatic. By week two that had settled, and the barrier balm was doing more work than expected just keeping things comfortable.\n\nThe visible shift didn't start until week four: fewer breakouts along the jaw, and a texture change that was more obvious in photos than in the mirror day to day. Tone evened out gradually rather than all at once, which tracks with how niacinamide is supposed to behave.\n\nBy week six, the routine had stopped feeling like an experiment and started feeling like maintenance. That's the actual marker of whether a routine works — not a dramatic before/after, but whether it's still worth doing once the novelty wears off.",
        status: "Published",
        date: "Jul 22, 2026",
        image: journalImages[JOURNAL_TITLES[3]] ?? null,
    },
];

export const FAQS: Faq[] = faqs.map((f, i) => ({ id: i + 1, q: f.q, a: f.a }));

// Product ids reference PRODUCTS in library/products.ts. Each ritual is a
// curated, shoppable subset — not just decorative copy — so "Shop Now" has
// real products to add to the bag.
export const RITUALS_DEFAULT: Ritual[] = [
    {
        id: 1,
        eyebrow: "Ritual One",
        title: "The Glass Skin Routine",
        copy: "Five steps, applied in order — for skin that looks lit from underneath.",
        image: ritualImages["The Glass Skin Routine"],
        productIds: [1, 5, 3],
    },
    {
        id: 2,
        eyebrow: "Ritual Two",
        title: "Barrier First",
        copy: "Rebuild what stripping actively broke, before you treat anything else.",
        image: ritualImages["Barrier First"],
        productIds: [2, 9, 8],
    },
];

export const CONCERNS_DEFAULT: Concern[] = [
    { id: 1, key: "dryness", title: "Dryness", image: concernImages.Dryness },
    { id: 2, key: "breakouts", title: "Breakouts", image: concernImages.Breakouts },
    { id: 3, key: "dullness", title: "Dullness", image: concernImages.Dullness },
    { id: 4, key: "fine-lines", title: "Fine Lines", image: concernImages["Fine Lines"] },
    { id: 5, key: "redness", title: "Redness", image: concernImages.Redness },
    { id: 6, key: "texture", title: "Texture", image: concernImages.Texture },
];

// No photo uploaded yet for any of these — TestimonialCard/the admin table
// both fall back to an initials avatar when `image` is null, same pattern as
// StaffMember.photo.
export const TESTIMONIALS: Testimonial[] = [
    {
        id: 1,
        image: null,
        name: "Marisol Ang",
        company: "Studio Vela",
        position: "Licensed Esthetician",
        message:
            "I recommend the Ritual Edit to clients who've been burned by ten-step routines before. It's the rare set that does less and delivers more.",
    },
    {
        id: 2,
        image: null,
        name: "Patricia Owyong",
        company: "Manila Bulletin",
        position: "Beauty Editor",
        message:
            "Cindyrella writes ingredient lists like they expect you to read them. That alone puts them ahead of most of what crosses my desk.",
    },
    {
        id: 3,
        image: null,
        name: "Dr. Renz Villaruel",
        company: "Villaruel Dermatology",
        position: "Dermatologist",
        message:
            "The Barrier Repair Cream is one of the few over-the-counter formulas I've stopped hesitating to suggest for reactive skin.",
    },
    {
        id: 4,
        image: null,
        name: "Camille Roa",
        company: "The Quiet Edit",
        position: "Founder",
        message:
            "Six weeks into the Overnight Retinol Serum and the texture change is obvious in photos, not just under studio lighting.",
    },
    {
        id: 5,
        image: null,
        name: "Josef Tuazon",
        company: "Lumen Salon & Spa",
        position: "Spa Director",
        message:
            "Our estheticians retail it with confidence because the formulas hold up to scrutiny, not just to a nice label.",
    },
    {
        id: 6,
        image: null,
        name: "Anica Buenaventura",
        company: "Self-employed",
        position: "Skincare Consultant",
        message:
            "Clients ask for products by name after one facial. The Quiet Glow Gel Cream is the one that comes up most.",
    },
    {
        id: 7,
        image: null,
        name: "Renato Cabahug",
        company: "Cabahug Pharmacy Group",
        position: "Pharmacist",
        message:
            "Straightforward dosing, no filler actives. It's easy to explain to a customer in thirty seconds, which is rarer than it should be.",
    },
    {
        id: 8,
        image: null,
        name: "Bettina Ilagan",
        company: "Field Notes PH",
        position: "Contributing Writer",
        message:
            "I've reordered the Vitamin C Brightening Drop three times now. That's the whole review.",
    },
    {
        id: 9,
        image: null,
        name: "Dominic Fajardo",
        company: "Grey Studio",
        position: "Creative Director",
        message:
            "Even the packaging respects your intelligence — no shouting, no urgency copy. It reads like a brand that trusts the product.",
    },
];
