import { journalImages } from "@/components/ui/images";
import { faqs } from "../faq";
import { BlogPost, Faq, NavMenuItem, Promo, StaticPage, Testimonial } from "./types";

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
        id: 1,
        slug: "about",
        name: "About",
        category: "Landing Page",
        updated: "Aug 12, 2026",
        content:
            "Cindyrella is a considered skincare studio, built around slow formulation and a small, deliberate catalogue.\n\nWe don't chase trends — every product exists because it earns its place in a routine.",
    },
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
export const PAGE_INTRO_DEFAULTS: Record<"shop" | "wishlist" | "cart", { headline: string; accent: string }> = {
    shop: { headline: "Everything we make,", accent: "in one place." },
    wishlist: { headline: "Formulas you're", accent: "still thinking about." },
    cart: { headline: "Everything you're", accent: "taking home." },
};

export const NAV_MENU: NavMenuItem[] = [
    { id: 1, label: "Serums", link: "#serums" },
    { id: 2, label: "Treatment", link: "#treatment" },
    { id: 3, label: "Moisturizers", link: "#moisturizers" },
    { id: 4, label: "Body", link: "#body" },
    { id: 5, label: "Journal", link: "/journal" },
    { id: 6, label: "Contact", link: "#contact" },
];

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
