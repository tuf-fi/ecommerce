"use client";

// Site content — hero, FAQ, blog posts, static pages, promotions — read by
// both the customer-facing pages and the admin CMS. Kept separate from
// adminStore.tsx (which holds admin-only operational data: auth, staff,
// orders, products, notifications) so customer pages can read this without
// pulling in an admin-only provider. Everything here is in-memory client
// state, same as adminStore — there's no backend yet.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { BlogPost, Faq, Promo, StaticPage, Testimonial } from "./admin/types";
import { BLOG_POSTS, FAQS, HOMEPAGE_HERO_DEFAULT, PAGE_INTRO_DEFAULTS, PROMOS, STATIC_PAGES, TESTIMONIALS } from "./admin/content";

// Persisted to localStorage so an edit made in the admin CMS survives a full
// page reload/new tab on the customer site — without this, a saved edit
// would only be visible for as long as the same client-side session (no
// Link-based navigation away and back) stayed mounted, since this is all
// in-memory state with no backend yet.
// Versioned (`_v2`) because the seed shape changed (STATIC_PAGES categories,
// new pageIntros) — an unversioned key would let an old cached blob from
// before that change silently shadow the new defaults on every load.
const STORAGE_KEY = "cindyrella_site_content_v2";

export type HeroContent = {
    headline: string;
    cta: string;
    subtext: string;
    image: string | null;
};

export type PageIntroKey = "shop" | "wishlist" | "cart";

export type PageIntroContent = {
    headline: string;
    accent: string;
};

type ContentStoreValue = {
    hero: HeroContent;
    updateHero: (patch: Partial<HeroContent>) => void;

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
};

const ContentContext = createContext<ContentStoreValue | null>(null);

function nextId<T extends { id: number }>(list: T[]): number {
    return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
    const [hero, setHero] = useState<HeroContent>(HOMEPAGE_HERO_DEFAULT);
    const updateHero = useCallback((patch: Partial<HeroContent>) => {
        setHero((h) => ({ ...h, ...patch }));
    }, []);

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

    // One-time read of a browser-only API at mount to hydrate from a prior
    // session — there's no way to know this before the client mounts, so
    // this can't be expressed as a derived/lazy-initial value.
    const [hydrated, setHydrated] = useState(false);
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved.hero) setHero(saved.hero);
                if (saved.faqs) setFaqs(saved.faqs);
                if (saved.blogPosts) setBlogPosts(saved.blogPosts);
                if (saved.pages) setPages(saved.pages);
                if (saved.pageIntros) setPageIntros(saved.pageIntros);
                if (saved.promos) setPromos(saved.promos);
                if (saved.testimonials) setTestimonials(saved.testimonials);
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
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ hero, faqs, blogPosts, pages, pageIntros, promos, testimonials }));
        } catch {
            // Storage full or inaccessible — edits still work for this session, just won't persist.
        }
    }, [hydrated, hero, faqs, blogPosts, pages, pageIntros, promos, testimonials]);

    const value: ContentStoreValue = {
        hero,
        updateHero,
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
    };

    return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
    const ctx = useContext(ContentContext);
    if (!ctx) throw new Error("useContent must be used within a ContentProvider");
    return ctx;
}
