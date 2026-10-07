"use client";

import { useParams } from "next/navigation";
import { useContent } from "@/library/content";
import HeroEditor from "@/components/admin/content/HeroEditor";
import AboutEditor from "@/components/admin/content/AboutEditor";
import PageIntroEditor from "@/components/admin/content/PageIntroEditor";
import PageContentEditor from "@/components/admin/content/PageContentEditor";
import PhilosophyEditor from "@/components/admin/content/PhilosophyEditor";
import NewsletterEditor from "@/components/admin/content/NewsletterEditor";
import { ContentEditorSkeleton, ContentNotFound } from "@/components/admin/content/ContentEditorShell";
import { PageIntroKey } from "@/library/content";
import { useMounted } from "@/library/useMounted";

const PAGE_INTRO_SLUGS: readonly string[] = ["shop", "wishlist", "cart", "journal"];
const BACK_HREF = "/admin/content?tab=pages";

export default function PageEditorPage() {
    const params = useParams<{ slug: string }>();
    const { pages, updatePageContent } = useContent();
    const mounted = useMounted();
    const page = pages.find((p) => p.slug === params.slug);

    if (!mounted) return <PageEditorSkeleton />;

    if (params.slug === "hero") {
        return <HeroEditor />;
    }

    if (params.slug === "about") {
        return <AboutEditor />;
    }

    if (PAGE_INTRO_SLUGS.includes(params.slug)) {
        return <PageIntroEditor pageKey={params.slug as PageIntroKey} />;
    }

    // Rituals/Concerns/Testimonials/FAQ are plain list-management pages (no live preview/rail), so they live as
    // their own static routes under (panel) instead — see app/admin/(panel)/content/pages/{slug}/page.tsx.

    if (params.slug === "philosophy") {
        return <PhilosophyEditor />;
    }

    if (params.slug === "newsletter") {
        return <NewsletterEditor />;
    }

    if (!page) {
        return <ContentNotFound message="Page not found." backLabel="Back to Pages" backHref={BACK_HREF} />;
    }

    return <PageContentEditor key={page.id} page={page} onSave={updatePageContent} />;
}

// One generic skeleton stands in for all slug-dependent sub-editors, since which one mounts isn't known yet.
function PageEditorSkeleton() {
    return <ContentEditorSkeleton fields={[{ labelWidth: "w-24", height: "h-[345px]" }]} />;
}
