"use client";

import { useParams } from "next/navigation";
import { useContent } from "@/library/content";
import HeroEditor from "@/components/admin/content/HeroEditor";
import AboutEditor from "@/components/admin/content/AboutEditor";
import PageIntroEditor from "@/components/admin/content/PageIntroEditor";
import PageContentEditor from "@/components/admin/content/PageContentEditor";
import PhilosophyEditor from "@/components/admin/content/PhilosophyEditor";
import NewsletterEditor from "@/components/admin/content/NewsletterEditor";
import { ContentNotFound } from "@/components/admin/content/ContentEditorShell";
import { PageIntroKey } from "@/library/content";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

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
    return (
        <SkeletonGroup>
            <div className="mb-6 flex items-center justify-between gap-4">
                <Skeleton className="h-[12.5px] w-28" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="overflow-hidden border border-ink/10 bg-white">
                    <div className="border-b border-ink/10 px-7 py-5">
                        <Skeleton className="h-[18px] w-40" />
                    </div>
                    <Skeleton tone="faint" className="h-40 w-full border-b border-ink/10" />

                    <div className="px-7 py-7">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="mb-4">
                                <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-24" />
                                <Skeleton tone="outline" className="h-11 w-full" />
                            </div>
                        ))}

                        <div>
                            <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-16" />
                            <Skeleton tone="outline" className="h-28 w-full" />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden border border-ink/10 bg-white">
                    <div className="border-b border-ink/10 bg-off/50 px-4 py-2.5">
                        <Skeleton tone="soft" className="h-[10px] w-14" />
                    </div>
                    <div className="p-4">
                        <Skeleton tone="soft" className="mb-3.5 h-[10.5px] w-20" />
                        <Skeleton tone="outline" className="h-11 w-full" />
                    </div>
                </div>
            </div>
        </SkeletonGroup>
    );
}
