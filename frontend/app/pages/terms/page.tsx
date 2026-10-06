"use client";

import TermsPage from "@/components/pages/TermsPage";
import { useContent } from "@/library/content";

export default function TermsRoute() {
    const { pages } = useContent();
    const page = pages.find((p) => p.slug === "terms");
    if (!page) return null;

    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-25 pb-20">
            <TermsPage page={page} />
        </div>
    );
}
