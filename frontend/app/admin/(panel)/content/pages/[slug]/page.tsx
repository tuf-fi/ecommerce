"use client";

import { useParams } from "next/navigation";
import { useContent } from "@/library/content";
import HeroEditor from "@/components/admin/content/HeroEditor";
import AboutEditor from "@/components/admin/content/AboutEditor";
import PageIntroEditor from "@/components/admin/content/PageIntroEditor";
import PageContentEditor from "@/components/admin/content/PageContentEditor";
import FaqEditor from "@/components/admin/content/FaqEditor";
import TestimonialsTab from "@/components/admin/content/TestimonialsTab";
import RitualsTab from "@/components/admin/content/RitualsTab";
import ConcernsTab from "@/components/admin/content/ConcernsTab";
import PhilosophyEditor from "@/components/admin/content/PhilosophyEditor";
import CatalogueEditor from "@/components/admin/content/CatalogueEditor";
import NewsletterEditor from "@/components/admin/content/NewsletterEditor";
import { ContentNotFound } from "@/components/admin/content/ContentEditorShell";
import { PageIntroKey } from "@/library/content";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const PAGE_INTRO_SLUGS: readonly string[] = ["shop", "wishlist", "cart", "journal"];
const BACK_HREF = "/admin/content?tab=pages";

export default function PageEditorPage() {
    const params = useParams<{ slug: string }>();
    const { pages, updatePageContent, faqs, addFaq, updateFaq, deleteFaq, moveFaq } = useContent();
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

    if (params.slug === "faq") {
        return <FaqEditor faqs={faqs} onAdd={addFaq} onUpdate={updateFaq} onDelete={deleteFaq} onMove={moveFaq} />;
    }

    if (params.slug === "testimonials") {
        return <TestimonialsTab />;
    }

    if (params.slug === "rituals") {
        return <RitualsTab />;
    }

    if (params.slug === "concerns") {
        return <ConcernsTab />;
    }

    if (params.slug === "philosophy") {
        return <PhilosophyEditor />;
    }

    if (params.slug === "catalogue") {
        return <CatalogueEditor />;
    }

    if (params.slug === "newsletter") {
        return <NewsletterEditor />;
    }

    if (!page) {
        return <ContentNotFound message="Page not found." backLabel="Back to Pages" backHref={BACK_HREF} />;
    }

    return <PageContentEditor key={page.id} page={page} onSave={updatePageContent} />;
}

// This route dispatches to one of many different sub-editors depending on
// the slug (Hero, About, page intros, FAQ, Testimonials, Rituals, Concerns,
// Philosophy, Catalogue, Newsletter, or a generic PageContentEditor), each
// with its own shape — so rather than one skeleton per sub-editor, this is a
// single generic "settings/editor form" stand-in: a heading, a handful of
// label+input-shaped rows, and a save button, reasonable regardless of which
// sub-editor ends up rendering once mounted.
function PageEditorSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 flex items-center justify-between gap-4">
                <Skeleton className="h-[12.5px] w-28" />
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white px-7 pt-10 pb-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <Skeleton className="h-[18px] w-40" />
                </div>

                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="mb-4">
                        <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-24" />
                        <Skeleton tone="outline" className="h-11 w-full" />
                    </div>
                ))}

                <div className="mb-4">
                    <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-16" />
                    <Skeleton tone="outline" className="h-28 w-full" />
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-4">
                <Skeleton tone="outline" className="h-[46px] w-36" />
            </div>
        </SkeletonGroup>
    );
}
