"use client";

import PrivacyPolicyPage from "@/components/pages/PrivacyPolicyPage";
import { useContent } from "@/library/content";

export default function PrivacyPolicyRoute() {
    const { pages } = useContent();
    const page = pages.find((p) => p.slug === "privacy-policy");
    if (!page) return null;

    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-25 pb-20">
            <PrivacyPolicyPage page={page} />
        </div>
    );
}
