"use client";

// Site content read by customer pages and the admin CMS; kept separate from adminStore.tsx (admin-only ops data) so customer pages don't pull in that provider.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "./api/client";
import { saveContentSection, SavedSections } from "./api/content";
import { BlogPost, Concern, Faq, FooterLinkItem, Promo, Ritual, SiteNavLink, StaticPage, Testimonial } from "./admin/types";
import { SectionKey } from "./admin/sections";
import {
    ABOUT_DEFAULT,
    BLOG_POSTS,
    CATALOGUE_DEFAULT,
    CONCERNS_DEFAULT,
    CONTACT_DEFAULT,
    CONTACT_INFO_DEFAULT,
    FAQS,
    FOOTER_COMPANY_LINKS_DEFAULT,
    FOOTER_PAYMENT_METHODS_DEFAULT,
    FOOTER_SHOP_LINKS_DEFAULT,
    HOMEPAGE_HERO_DEFAULT,
    NAV_LINKS_DEFAULT,
    NEWSLETTER_DEFAULT,
    PAGE_INTRO_DEFAULTS,
    PHILOSOPHY_DEFAULT,
    PROMOS,
    RITUALS_DEFAULT,
    SECTION_VISIBILITY_DEFAULT,
    SOCIAL_LINKS_DEFAULT,
    STATIC_PAGES,
    TESTIMONIALS,
    slugify,
} from "./admin/content";

// Re-exported so call sites reading content types from here don't need to know SectionKey is declared in library/admin/sections.ts.
export type { SectionKey };


export type HeroContent = {
    headline: string;
    cta: string;
    subtext: string;
    image: string | null;
};

export type PageIntroKey = "shop" | "wishlist" | "cart" | "journal";

export type PageIntroContent = {
    headline: string;
    accent: string;
};

export type AboutContent = {
    founder: string;
    location: string;
    focus: string;
    lead: string;
    body: string;
};

// Same headline/accent split as PageIntroContent — Contact's "Let's / talk skin." is the identical two-line treatment.
export type ContactContent = PageIntroContent;

export type PhilosophyContent = {
    eyebrow: string;
    headline: string;
    subtext: string;
};

export type CatalogueContent = {
    ctaLabel: string;
};

export type NewsletterContent = {
    headline: string;
    accent: string;
    body: string;
    socialProof: string;
};

// Read by both Contact and Footer; address/hours are two lines each since both render a hard <br/> between them.
export type ContactInfo = {
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    hoursLine1: string;
    hoursLine2: string;
};

// Fixed to these five platforms — their icons are hand-drawn inline SVGs in Contact.tsx/Footer.tsx, so adding a sixth is a code change, not content.
export type SocialLinks = {
    instagramUrl: string;
    instagramEnabled: boolean;
    tiktokUrl: string;
    tiktokEnabled: boolean;
    pinterestUrl: string;
    pinterestEnabled: boolean;
    facebookUrl: string;
    facebookEnabled: boolean;
    xUrl: string;
    xEnabled: boolean;
};

// The footer's two editable link columns, keyed rather than duplicated since the CRUD is byte-for-byte identical for both.
export type FooterLinkGroup = "shop" | "company";

type ContentStoreValue = {
    // One shared map (not a per-type `enabled` flag) since some sections are list-backed with no singleton to hang a boolean on, and so PagesTab reads every row the same way.
    sectionVisibility: Record<SectionKey, boolean>;
    updateSectionVisibility: (key: SectionKey, enabled: boolean) => void;

    hero: HeroContent;
    updateHero: (patch: Partial<HeroContent>) => void;

    about: AboutContent;
    updateAbout: (patch: Partial<AboutContent>) => void;

    contact: ContactContent;
    updateContact: (patch: Partial<ContactContent>) => void;

    philosophy: PhilosophyContent;
    updatePhilosophy: (patch: Partial<PhilosophyContent>) => void;

    catalogue: CatalogueContent;

    newsletter: NewsletterContent;
    updateNewsletter: (patch: Partial<NewsletterContent>) => void;

    contactInfo: ContactInfo;
    updateContactInfo: (patch: Partial<ContactInfo>) => void;

    socialLinks: SocialLinks;
    updateSocialLinks: (patch: Partial<SocialLinks>) => void;

    navLinks: SiteNavLink[];
    addNavLink: (input: Omit<SiteNavLink, "id">) => SiteNavLink;
    updateNavLink: (id: number, patch: Partial<Omit<SiteNavLink, "id">>) => void;
    deleteNavLink: (id: number) => void;
    moveNavLink: (id: number, direction: "up" | "down") => void;

    footerShopLinks: FooterLinkItem[];
    footerCompanyLinks: FooterLinkItem[];
    addFooterLink: (group: FooterLinkGroup, input: Omit<FooterLinkItem, "id">) => void;
    updateFooterLink: (group: FooterLinkGroup, id: number, patch: Partial<Omit<FooterLinkItem, "id">>) => void;
    deleteFooterLink: (group: FooterLinkGroup, id: number) => void;

    footerPaymentMethods: string[];

    faqs: Faq[];
    addFaq: (input: Omit<Faq, "id">) => Faq;
    updateFaq: (id: number, patch: Partial<Omit<Faq, "id">>) => void;
    deleteFaq: (id: number) => void;
    moveFaq: (id: number, direction: "up" | "down") => void;

    blogPosts: BlogPost[];
    addBlogPost: (input: Omit<BlogPost, "id">) => BlogPost;
    updateBlogPost: (id: number, patch: Partial<Omit<BlogPost, "id">>) => void;
    deleteBlogPost: (id: number) => void;

    pages: StaticPage[];
    updatePageContent: (id: number, content: string) => void;

    pageIntros: Record<PageIntroKey, PageIntroContent>;
    updatePageIntro: (key: PageIntroKey, patch: Partial<PageIntroContent>) => void;

    promos: Promo[];
    addPromo: (input: Omit<Promo, "id">) => Promo;
    updatePromo: (id: number, patch: Partial<Omit<Promo, "id">>) => void;
    deletePromo: (id: number) => void;
    togglePromoActive: (id: number) => void;

    testimonials: Testimonial[];
    addTestimonial: (input: Omit<Testimonial, "id">) => Testimonial;
    updateTestimonial: (id: number, patch: Partial<Omit<Testimonial, "id">>) => void;
    deleteTestimonial: (id: number) => void;
    moveTestimonial: (id: number, direction: "up" | "down") => void;

    rituals: Ritual[];
    addRitual: (input: Omit<Ritual, "id">) => Ritual;
    updateRitual: (id: number, patch: Partial<Omit<Ritual, "id">>) => void;
    deleteRitual: (id: number) => void;
    moveRitual: (id: number, direction: "up" | "down") => void;

    concerns: Concern[];
    // `key` is derived from `title` at creation (see slugify) and never patched afterward — see the Concern type for why.
    addConcern: (input: Omit<Concern, "id" | "key">) => Concern;
    updateConcern: (id: number, patch: Partial<Omit<Concern, "id" | "key">>) => void;
    deleteConcern: (id: number) => void;
    moveConcern: (id: number, direction: "up" | "down") => void;
};

const ContentContext = createContext<ContentStoreValue | null>(null);

function nextId<T extends { id: number }>(list: T[]): number {
    return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

// Appends -2, -3, … until unique — two titles normalizing to the same slug would otherwise collide as a /shop?concern= filter target.
function uniqueSlug(base: string, existing: { key: string }[]): string {
    if (!existing.some((item) => item.key === base)) return base;
    let n = 2;
    while (existing.some((item) => item.key === `${base}-${n}`)) n++;
    return `${base}-${n}`;
}

// Embedded base64 images (an upload that couldn't be hosted) are never saved to the server; they are dropped to null.
function withoutEmbeddedImages(value: unknown): unknown {
    if (typeof value === "string") return value.startsWith("data:") ? null : value;
    if (Array.isArray(value)) return value.map(withoutEmbeddedImages);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withoutEmbeddedImages(v)]));
    return value;
}

const SAVE_DELAY_MS = 700;

// `initial` is whatever an admin has saved on the server (fetched during render of the root layout). Anything not saved
// there starts from the built-in defaults, and edits are written back to the server automatically.
export function ContentProvider({ children, initial = {} }: { children: React.ReactNode; initial?: SavedSections }) {
    const seed = <T,>(key: string, fallback: T): T => (initial[key] as T | undefined) ?? fallback;
    const [sectionVisibility, setSectionVisibility] = useState<Record<SectionKey, boolean>>({ ...SECTION_VISIBILITY_DEFAULT, ...seed<Partial<Record<SectionKey, boolean>>>("visibility", {}) });
    const updateSectionVisibility = useCallback((key: SectionKey, enabled: boolean) => {
        setSectionVisibility((prev) => ({ ...prev, [key]: enabled }));
    }, []);

    const [hero, setHero] = useState<HeroContent>(seed("hero", HOMEPAGE_HERO_DEFAULT));
    const updateHero = useCallback((patch: Partial<HeroContent>) => {
        setHero((h) => ({ ...h, ...patch }));
    }, []);

    const [about, setAbout] = useState<AboutContent>(seed("about", ABOUT_DEFAULT));
    const updateAbout = useCallback((patch: Partial<AboutContent>) => {
        setAbout((a) => ({ ...a, ...patch }));
    }, []);

    const [contact, setContact] = useState<ContactContent>(seed("contact", CONTACT_DEFAULT));
    const updateContact = useCallback((patch: Partial<ContactContent>) => {
        setContact((c) => ({ ...c, ...patch }));
    }, []);

    const [philosophy, setPhilosophy] = useState<PhilosophyContent>(seed("philosophy", PHILOSOPHY_DEFAULT));
    const updatePhilosophy = useCallback((patch: Partial<PhilosophyContent>) => {
        setPhilosophy((p) => ({ ...p, ...patch }));
    }, []);

    // No admin editor writes to this anymore (Shop All is toggle-only, see PagesTab) — kept read-only for Catalogue.tsx's ctaLabel.
    const [catalogue] = useState<CatalogueContent>(CATALOGUE_DEFAULT);

    const [newsletter, setNewsletter] = useState<NewsletterContent>(seed("newsletter", NEWSLETTER_DEFAULT));
    const updateNewsletter = useCallback((patch: Partial<NewsletterContent>) => {
        setNewsletter((n) => ({ ...n, ...patch }));
    }, []);

    const [contactInfo, setContactInfo] = useState<ContactInfo>(seed("contactInfo", CONTACT_INFO_DEFAULT));
    const updateContactInfo = useCallback((patch: Partial<ContactInfo>) => {
        setContactInfo((c) => ({ ...c, ...patch }));
    }, []);

    const [socialLinks, setSocialLinks] = useState<SocialLinks>({ ...SOCIAL_LINKS_DEFAULT, ...seed<Partial<SocialLinks>>("socialLinks", {}) });
    const updateSocialLinks = useCallback((patch: Partial<SocialLinks>) => {
        setSocialLinks((s) => ({ ...s, ...patch }));
    }, []);

    const [navLinks, setNavLinks] = useState<SiteNavLink[]>(seed("navLinks", NAV_LINKS_DEFAULT));

    const addNavLink = useCallback((input: Omit<SiteNavLink, "id">) => {
        let created!: SiteNavLink;
        setNavLinks((n) => {
            created = { ...input, id: nextId(n) };
            return [...n, created];
        });
        return created;
    }, []);

    const updateNavLink = useCallback((id: number, patch: Partial<Omit<SiteNavLink, "id">>) => {
        setNavLinks((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    }, []);

    const deleteNavLink = useCallback((id: number) => {
        setNavLinks((prev) => prev.filter((n) => n.id !== id));
        toast.success("Navigation link removed.");
    }, []);

    const moveNavLink = useCallback((id: number, direction: "up" | "down") => {
        setNavLinks((prev) => {
            const idx = prev.findIndex((n) => n.id === id);
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
            return next;
        });
    }, []);

    const [footerShopLinks, setFooterShopLinks] = useState<FooterLinkItem[]>(seed("footerShopLinks", FOOTER_SHOP_LINKS_DEFAULT));
    const [footerCompanyLinks, setFooterCompanyLinks] = useState<FooterLinkItem[]>(seed("footerCompanyLinks", FOOTER_COMPANY_LINKS_DEFAULT));

    // One setter per group, picked by key, since the three callbacks below are otherwise identical for Shop and Company.
    const footerSetter = useCallback(
        (group: FooterLinkGroup) => (group === "shop" ? setFooterShopLinks : setFooterCompanyLinks),
        []
    );

    const addFooterLink = useCallback(
        (group: FooterLinkGroup, input: Omit<FooterLinkItem, "id">) => {
            footerSetter(group)((prev) => [...prev, { ...input, id: nextId(prev) }]);
        },
        [footerSetter]
    );

    const updateFooterLink = useCallback(
        (group: FooterLinkGroup, id: number, patch: Partial<Omit<FooterLinkItem, "id">>) => {
            footerSetter(group)((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
        },
        [footerSetter]
    );

    const deleteFooterLink = useCallback(
        (group: FooterLinkGroup, id: number) => {
            footerSetter(group)((prev) => prev.filter((l) => l.id !== id));
            toast.success("Footer link removed.");
        },
        [footerSetter]
    );

    // Display-only, no editor yet — see FOOTER_PAYMENT_METHODS_DEFAULT.
    const footerPaymentMethods = FOOTER_PAYMENT_METHODS_DEFAULT;

    const [faqs, setFaqs] = useState<Faq[]>(seed("faqs", FAQS));

    const addFaq = useCallback((input: Omit<Faq, "id">) => {
        let created!: Faq;
        setFaqs((f) => {
            created = { ...input, id: nextId(f) };
            return [...f, created];
        });
        return created;
    }, []);

    const updateFaq = useCallback((id: number, patch: Partial<Omit<Faq, "id">>) => {
        setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    }, []);

    const deleteFaq = useCallback((id: number) => {
        setFaqs((prev) => prev.filter((f) => f.id !== id));
        toast.success("FAQ removed.");
    }, []);

    const moveFaq = useCallback((id: number, direction: "up" | "down") => {
        setFaqs((prev) => {
            const idx = prev.findIndex((f) => f.id === id);
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
            return next;
        });
    }, []);

    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(seed("blogPosts", BLOG_POSTS));

    const addBlogPost = useCallback((input: Omit<BlogPost, "id">) => {
        let created!: BlogPost;
        setBlogPosts((b) => {
            created = { ...input, id: nextId(b) };
            return [created, ...b];
        });
        return created;
    }, []);

    const updateBlogPost = useCallback((id: number, patch: Partial<Omit<BlogPost, "id">>) => {
        setBlogPosts((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    }, []);

    const deleteBlogPost = useCallback((id: number) => {
        setBlogPosts((prev) => prev.filter((b) => b.id !== id));
        toast.success("Post removed.");
    }, []);

    const [pages, setPages] = useState<StaticPage[]>(seed("pages", STATIC_PAGES));

    const updatePageContent = useCallback((id: number, content: string) => {
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        setPages((prev) => prev.map((p) => (p.id === id ? { ...p, content, updated: today } : p)));
        toast.success("Page saved.");
    }, []);

    const [pageIntros, setPageIntros] = useState<Record<PageIntroKey, PageIntroContent>>({ ...PAGE_INTRO_DEFAULTS, ...seed<Partial<Record<PageIntroKey, PageIntroContent>>>("pageIntros", {}) });

    const updatePageIntro = useCallback((key: PageIntroKey, patch: Partial<PageIntroContent>) => {
        setPageIntros((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    }, []);

    const [promos, setPromos] = useState<Promo[]>(seed("promos", PROMOS));

    const addPromo = useCallback((input: Omit<Promo, "id">) => {
        let created!: Promo;
        setPromos((p) => {
            created = { ...input, id: nextId(p) };
            return [created, ...p];
        });
        return created;
    }, []);

    const updatePromo = useCallback((id: number, patch: Partial<Omit<Promo, "id">>) => {
        setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    }, []);

    const deletePromo = useCallback((id: number) => {
        setPromos((prev) => prev.filter((p) => p.id !== id));
        toast.success("Promotion removed.");
    }, []);

    const togglePromoActive = useCallback((id: number) => {
        setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
    }, []);

    const [testimonials, setTestimonials] = useState<Testimonial[]>(seed("testimonials", TESTIMONIALS));

    const addTestimonial = useCallback((input: Omit<Testimonial, "id">) => {
        let created!: Testimonial;
        setTestimonials((t) => {
            created = { ...input, id: nextId(t) };
            return [...t, created];
        });
        return created;
    }, []);

    const updateTestimonial = useCallback((id: number, patch: Partial<Omit<Testimonial, "id">>) => {
        setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    }, []);

    const deleteTestimonial = useCallback((id: number) => {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        toast.success("Testimonial removed.");
    }, []);

    const moveTestimonial = useCallback((id: number, direction: "up" | "down") => {
        setTestimonials((prev) => {
            const idx = prev.findIndex((t) => t.id === id);
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
            return next;
        });
    }, []);

    const [rituals, setRituals] = useState<Ritual[]>(seed("rituals", RITUALS_DEFAULT));

    const addRitual = useCallback((input: Omit<Ritual, "id">) => {
        let created!: Ritual;
        setRituals((r) => {
            created = { ...input, id: nextId(r) };
            return [...r, created];
        });
        return created;
    }, []);

    const updateRitual = useCallback((id: number, patch: Partial<Omit<Ritual, "id">>) => {
        setRituals((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    }, []);

    const deleteRitual = useCallback((id: number) => {
        setRituals((prev) => prev.filter((r) => r.id !== id));
        toast.success("Ritual removed.");
    }, []);

    const moveRitual = useCallback((id: number, direction: "up" | "down") => {
        setRituals((prev) => {
            const idx = prev.findIndex((r) => r.id === id);
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
            return next;
        });
    }, []);

    const [concerns, setConcerns] = useState<Concern[]>(seed("concerns", CONCERNS_DEFAULT));

    const addConcern = useCallback((input: Omit<Concern, "id" | "key">) => {
        let created!: Concern;
        setConcerns((c) => {
            created = { ...input, id: nextId(c), key: uniqueSlug(slugify(input.title), c) };
            return [...c, created];
        });
        return created;
    }, []);

    const updateConcern = useCallback((id: number, patch: Partial<Omit<Concern, "id" | "key">>) => {
        setConcerns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    }, []);

    const deleteConcern = useCallback((id: number) => {
        setConcerns((prev) => prev.filter((c) => c.id !== id));
        toast.success("Concern removed.");
    }, []);

    const moveConcern = useCallback((id: number, direction: "up" | "down") => {
        setConcerns((prev) => {
            const idx = prev.findIndex((c) => c.id === id);
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
            return next;
        });
    }, []);

    // Writes edits back to the server. `synced` remembers what the server is known to hold for each section (the first run
    // records the starting state, so merely loading never saves). A section that then drifts from it is saved after a short
    // pause. Only signed-in staff ever change this state; if a save is rejected the next edit retries it.
    const synced = useRef<Record<string, string>>({});
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    useEffect(() => {
        const sections: Record<string, unknown> = {
            visibility: sectionVisibility,
            hero,
            about,
            contact,
            philosophy,
            newsletter,
            contactInfo,
            socialLinks,
            navLinks,
            footerShopLinks,
            footerCompanyLinks,
            faqs,
            blogPosts,
            pages,
            pageIntros,
            promos,
            testimonials,
            rituals,
            concerns,
        };
        for (const [key, value] of Object.entries(sections)) {
            const payload = withoutEmbeddedImages(value);
            const json = JSON.stringify(payload);
            if (synced.current[key] === undefined) {
                synced.current[key] = json;
                continue;
            }
            if (synced.current[key] === json) continue;
            clearTimeout(timers.current[key]);
            timers.current[key] = setTimeout(() => {
                saveContentSection(key, payload)
                    .then(() => {
                        synced.current[key] = json;
                    })
                    .catch((err) => {
                        toast.error(err instanceof ApiError && err.status === 401 ? "Your session expired — sign in again to save changes." : "Couldn't save your changes. They'll be retried on your next edit.");
                    });
            }, SAVE_DELAY_MS);
        }
    }, [sectionVisibility, hero, about, contact, philosophy, newsletter, contactInfo, socialLinks, navLinks, footerShopLinks, footerCompanyLinks, faqs, blogPosts, pages, pageIntros, promos, testimonials, rituals, concerns]);

    const value: ContentStoreValue = {
        sectionVisibility,
        updateSectionVisibility,
        hero,
        updateHero,
        about,
        updateAbout,
        contact,
        updateContact,
        philosophy,
        updatePhilosophy,
        catalogue,
        newsletter,
        updateNewsletter,
        contactInfo,
        updateContactInfo,
        socialLinks,
        updateSocialLinks,
        navLinks,
        addNavLink,
        updateNavLink,
        deleteNavLink,
        moveNavLink,
        footerShopLinks,
        footerCompanyLinks,
        addFooterLink,
        updateFooterLink,
        deleteFooterLink,
        footerPaymentMethods,
        faqs,
        addFaq,
        updateFaq,
        deleteFaq,
        moveFaq,
        blogPosts,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        pages,
        updatePageContent,
        pageIntros,
        updatePageIntro,
        promos,
        addPromo,
        updatePromo,
        deletePromo,
        togglePromoActive,
        testimonials,
        addTestimonial,
        updateTestimonial,
        deleteTestimonial,
        moveTestimonial,
        rituals,
        addRitual,
        updateRitual,
        deleteRitual,
        moveRitual,
        concerns,
        addConcern,
        updateConcern,
        deleteConcern,
        moveConcern,
    };

    return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
    const ctx = useContext(ContentContext);
    if (!ctx) throw new Error("useContent must be used within a ContentProvider");
    return ctx;
}
