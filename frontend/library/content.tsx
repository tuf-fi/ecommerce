"use client";

// Site content — hero, FAQ, blog posts, static pages, promotions — read by
// both the customer-facing pages and the admin CMS. Kept separate from
// adminStore.tsx (which holds admin-only operational data: auth, staff,
// orders, products, notifications) so customer pages can read this without
// pulling in an admin-only provider. Everything here is in-memory client
// state, same as adminStore — there's no backend yet.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
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

// Re-exported so the many call sites that already read their content types
// from this file don't need to know the key union is declared next to the
// anchor/label maps it keys (see library/admin/sections.ts).
export type { SectionKey };

// Persisted to localStorage so an edit made in the admin CMS survives a full
// page reload — there's no backend yet, so this is the only persistence.
// Versioned because the seed shape changes over time and an unversioned key
// would let an old cached blob silently shadow new defaults. Bumping the
// version does NOT migrate data by itself — it points reads at a key that
// doesn't exist yet — so LEGACY_STORAGE_KEYS below is required on every bump
// or every field saved under the old key is lost, not just the ones that
// motivated the bump.
const STORAGE_KEY = "cindyrella_site_content_v4";
const LEGACY_STORAGE_KEYS = ["cindyrella_site_content_v3", "cindyrella_site_content_v2", "cindyrella_site_content_v1"];

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

// Same headline/accent split as PageIntroContent — the Contact section's
// "Let's / talk skin." is the identical two-line treatment.
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

// The one set of contact details, read by both the Contact section and the
// Footer. Address and hours are stored as two lines each because both render
// them with a hard <br/> between — a single free-text field would have to
// guess where that break belongs.
export type ContactInfo = {
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    hoursLine1: string;
    hoursLine2: string;
};

// Fixed to these five platforms: the icons are hand-drawn inline SVGs in
// Contact.tsx/Footer.tsx, so there's nothing to render for an arbitrary
// sixth network. Adding one is a code change, not a content change.
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

// The footer's two editable link columns. Keyed rather than split into two
// near-identical sets of callbacks, since the CRUD is byte-for-byte the same
// for both — the Links tab just passes the column it's rendering.
export type FooterLinkGroup = "shop" | "company";

type ContentStoreValue = {
    // Which homepage sections render at all. One shared map rather than an
    // `enabled` flag on each content type, because three of the twelve
    // sections (testimonials/faq/journal) are backed by lists with no
    // singleton object to hang a boolean on, and because PagesTab's "Visible"
    // column can then read every row the same way.
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
    updateCatalogue: (patch: Partial<CatalogueContent>) => void;

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
    // `key` is derived from `title` at creation (see slugify) and never
    // patched afterward — see the Concern type for why.
    addConcern: (input: Omit<Concern, "id" | "key">) => Concern;
    updateConcern: (id: number, patch: Partial<Omit<Concern, "id" | "key">>) => void;
    deleteConcern: (id: number) => void;
    moveConcern: (id: number, direction: "up" | "down") => void;
};

const ContentContext = createContext<ContentStoreValue | null>(null);

function nextId<T extends { id: number }>(list: T[]): number {
    return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

// Appends -2, -3, … until the slug no longer collides with an existing key —
// two titles that normalize to the same slug would otherwise share one key
// and become indistinguishable as a /shop?concern= filter target.
function uniqueSlug(base: string, existing: { key: string }[]): string {
    if (!existing.some((item) => item.key === base)) return base;
    let n = 2;
    while (existing.some((item) => item.key === `${base}-${n}`)) n++;
    return `${base}-${n}`;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
    const [sectionVisibility, setSectionVisibility] = useState<Record<SectionKey, boolean>>(SECTION_VISIBILITY_DEFAULT);
    const updateSectionVisibility = useCallback((key: SectionKey, enabled: boolean) => {
        setSectionVisibility((prev) => ({ ...prev, [key]: enabled }));
    }, []);

    const [hero, setHero] = useState<HeroContent>(HOMEPAGE_HERO_DEFAULT);
    const updateHero = useCallback((patch: Partial<HeroContent>) => {
        setHero((h) => ({ ...h, ...patch }));
    }, []);

    const [about, setAbout] = useState<AboutContent>(ABOUT_DEFAULT);
    const updateAbout = useCallback((patch: Partial<AboutContent>) => {
        setAbout((a) => ({ ...a, ...patch }));
    }, []);

    const [contact, setContact] = useState<ContactContent>(CONTACT_DEFAULT);
    const updateContact = useCallback((patch: Partial<ContactContent>) => {
        setContact((c) => ({ ...c, ...patch }));
    }, []);

    const [philosophy, setPhilosophy] = useState<PhilosophyContent>(PHILOSOPHY_DEFAULT);
    const updatePhilosophy = useCallback((patch: Partial<PhilosophyContent>) => {
        setPhilosophy((p) => ({ ...p, ...patch }));
    }, []);

    const [catalogue, setCatalogue] = useState<CatalogueContent>(CATALOGUE_DEFAULT);
    const updateCatalogue = useCallback((patch: Partial<CatalogueContent>) => {
        setCatalogue((c) => ({ ...c, ...patch }));
    }, []);

    const [newsletter, setNewsletter] = useState<NewsletterContent>(NEWSLETTER_DEFAULT);
    const updateNewsletter = useCallback((patch: Partial<NewsletterContent>) => {
        setNewsletter((n) => ({ ...n, ...patch }));
    }, []);

    const [contactInfo, setContactInfo] = useState<ContactInfo>(CONTACT_INFO_DEFAULT);
    const updateContactInfo = useCallback((patch: Partial<ContactInfo>) => {
        setContactInfo((c) => ({ ...c, ...patch }));
    }, []);

    const [socialLinks, setSocialLinks] = useState<SocialLinks>(SOCIAL_LINKS_DEFAULT);
    const updateSocialLinks = useCallback((patch: Partial<SocialLinks>) => {
        setSocialLinks((s) => ({ ...s, ...patch }));
    }, []);

    const [navLinks, setNavLinks] = useState<SiteNavLink[]>(NAV_LINKS_DEFAULT);

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

    const [footerShopLinks, setFooterShopLinks] = useState<FooterLinkItem[]>(FOOTER_SHOP_LINKS_DEFAULT);
    const [footerCompanyLinks, setFooterCompanyLinks] = useState<FooterLinkItem[]>(FOOTER_COMPANY_LINKS_DEFAULT);

    // One setter per group, picked by key — the three callbacks below are
    // otherwise identical for Shop and Company.
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

    // Display-only badges with no editor — see FOOTER_PAYMENT_METHODS_DEFAULT
    // for why they aren't content an admin can change yet.
    const footerPaymentMethods = FOOTER_PAYMENT_METHODS_DEFAULT;

    const [faqs, setFaqs] = useState<Faq[]>(FAQS);

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

    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(BLOG_POSTS);

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

    const [pages, setPages] = useState<StaticPage[]>(STATIC_PAGES);

    const updatePageContent = useCallback((id: number, content: string) => {
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        setPages((prev) => prev.map((p) => (p.id === id ? { ...p, content, updated: today } : p)));
        toast.success("Page saved.");
    }, []);

    const [pageIntros, setPageIntros] = useState<Record<PageIntroKey, PageIntroContent>>(PAGE_INTRO_DEFAULTS);

    const updatePageIntro = useCallback((key: PageIntroKey, patch: Partial<PageIntroContent>) => {
        setPageIntros((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    }, []);

    const [promos, setPromos] = useState<Promo[]>(PROMOS);

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

    const [testimonials, setTestimonials] = useState<Testimonial[]>(TESTIMONIALS);

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

    const [rituals, setRituals] = useState<Ritual[]>(RITUALS_DEFAULT);

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

    const [concerns, setConcerns] = useState<Concern[]>(CONCERNS_DEFAULT);

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

    // One-time read of a browser-only API at mount to hydrate from a prior
    // session — there's no way to know this before the client mounts, so
    // this can't be expressed as a derived/lazy-initial value.
    const [hydrated, setHydrated] = useState(false);
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        try {
            // Falls back to the newest legacy key so a version bump carries
            // existing edits forward instead of silently reverting them to
            // seed defaults — see LEGACY_STORAGE_KEYS above.
            const raw =
                window.localStorage.getItem(STORAGE_KEY) ??
                LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find((value) => value != null) ??
                null;
            if (raw) {
                const saved = JSON.parse(raw);
                // Merged into the full defaults rather than replacing them, so
                // a thirteenth section added later can never come back
                // `undefined` from a blob saved before it existed — an
                // undefined flag would read as "hidden" at every render guard.
                if (saved.sectionVisibility) {
                    setSectionVisibility({ ...SECTION_VISIBILITY_DEFAULT, ...saved.sectionVisibility });
                }
                if (saved.hero) setHero(saved.hero);
                if (saved.about) setAbout(saved.about);
                if (saved.contact) setContact(saved.contact);
                if (saved.philosophy) setPhilosophy(saved.philosophy);
                if (saved.catalogue) setCatalogue(saved.catalogue);
                if (saved.newsletter) setNewsletter(saved.newsletter);
                if (saved.contactInfo) setContactInfo(saved.contactInfo);
                // Merged for the same reason as sectionVisibility above — a
                // blob saved before the enabled flags existed would otherwise
                // come back with them `undefined`, which reads as falsy and
                // hides every icon that used to show.
                if (saved.socialLinks) setSocialLinks({ ...SOCIAL_LINKS_DEFAULT, ...saved.socialLinks });
                if (saved.navLinks) setNavLinks(saved.navLinks);
                if (saved.footerShopLinks) setFooterShopLinks(saved.footerShopLinks);
                if (saved.footerCompanyLinks) setFooterCompanyLinks(saved.footerCompanyLinks);
                if (saved.faqs) setFaqs(saved.faqs);
                if (saved.blogPosts) setBlogPosts(saved.blogPosts);
                if (saved.pages) setPages(saved.pages);
                // Merged for the same reason as sectionVisibility above — a
                // cache saved before "journal" existed would otherwise come
                // back missing that key entirely, and PageIntro reads
                // pageIntros[pageKey] with no fallback.
                if (saved.pageIntros) setPageIntros({ ...PAGE_INTRO_DEFAULTS, ...saved.pageIntros });
                if (saved.promos) setPromos(saved.promos);
                if (saved.testimonials) setTestimonials(saved.testimonials);
                if (saved.rituals) setRituals(saved.rituals);
                if (saved.concerns) setConcerns(saved.concerns);
            }
        } catch {
            // Corrupt or inaccessible storage — fall back to the seed defaults.
        }
        setHydrated(true);
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Gated on `hydrated` so this never fires before the load above has had
    // a chance to run — otherwise the very first render's seed defaults
    // would overwrite whatever was actually saved.
    useEffect(() => {
        if (!hydrated) return;
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    sectionVisibility,
                    hero,
                    about,
                    contact,
                    philosophy,
                    catalogue,
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
                })
            );
        } catch {
            // Storage full or inaccessible — edits still work for this session, just won't persist.
        }
    }, [
        hydrated,
        sectionVisibility,
        hero,
        about,
        contact,
        philosophy,
        catalogue,
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
    ]);

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
        updateCatalogue,
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
