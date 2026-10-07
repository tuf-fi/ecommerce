"use client";

import { useRouter, useSearchParams } from "next/navigation";
import PromotionsTab from "@/components/admin/content/PromotionsTab";
import PagesTab from "@/components/admin/content/PagesTab";
import CollectionsTab from "@/components/admin/content/CollectionsTab";
import ContactTab from "@/components/admin/content/ContactTab";
import LinksTab from "@/components/admin/content/LinksTab";
import BlogTab from "@/components/admin/content/BlogTab";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const TABS = [
    { key: "pages", label: "Pages" },
    { key: "collections", label: "Content Collections" },
    { key: "blog", label: "Blog" },
    { key: "promotions", label: "Promotions" },
    { key: "links", label: "Links" },
    { key: "contact", label: "Contact Information" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ContentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const active = (searchParams.get("tab") as TabKey) ?? "pages";
    const mounted = useMounted();

    if (!mounted) return <ContentPageSkeleton />;

    return (
        <div>
            <div className="mb-6 flex gap-x-7 overflow-x-auto border-b border-ink/10 font-mono text-[11px] tracking-[.1em] whitespace-nowrap uppercase [scrollbar-width:none] sm:mb-8 sm:flex-wrap sm:gap-y-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => router.push(`/admin/content?tab=${t.key}`)}
                        className={`relative flex-none pb-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 ${active === t.key ? "text-pink-dark" : "text-grey hover:text-ink"}`}
                    >
                        {t.label}
                        {active === t.key && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-pink-dark sm:-bottom-px" />}
                    </button>
                ))}
            </div>

            {active === "promotions" && <PromotionsTab />}
            {active === "pages" && <PagesTab />}
            {active === "collections" && <CollectionsTab />}
            {active === "contact" && <ContactTab />}
            {active === "links" && <LinksTab />}
            {active === "blog" && <BlogTab />}
        </div>
    );
}

function ContentPageSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 flex gap-x-7 overflow-hidden border-b border-ink/10 pb-2.5 sm:mb-8 sm:flex-wrap sm:gap-y-2">
                {TABS.map((t) => (
                    <div key={t.key} className="flex h-[16.5px] flex-none items-center">
                        <Skeleton className="h-[11px] w-16" />
                    </div>
                ))}
            </div>

            <div className="flex flex-col border border-ink/10 bg-white sm:flex-row">
                <div className="flex flex-none divide-x divide-ink/10 overflow-hidden border-b border-ink/10 sm:w-64 sm:flex-col sm:divide-x-0 sm:divide-y sm:border-r sm:border-b-0">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex-none px-4 py-3.5 sm:px-5 sm:py-4">
                            <Skeleton className="h-[13.5px] w-28" />
                            <Skeleton tone="soft" className="mt-1.5 hidden h-[11px] w-32 sm:block" />
                        </div>
                    ))}
                </div>

                <div className="min-w-0 flex-1 p-4 sm:p-7">
                    <div className="mb-5">
                        <Skeleton className="h-[15px] w-44" />
                        <Skeleton tone="soft" className="mt-2 h-3 w-80 max-w-full" />
                    </div>
                    <div className="overflow-hidden border border-ink/10 bg-white shadow-card">
                        <div className="flex items-center gap-4 border-b border-ink/10 bg-off/50 px-3 py-3.5 sm:gap-6 sm:px-5">
                            <Skeleton tone="soft" className="h-[10px] w-14" />
                            <Skeleton tone="soft" className="ml-auto hidden h-[10px] w-20 md:block" />
                            <Skeleton tone="soft" className="ml-auto h-[10px] w-12 md:ml-0" />
                        </div>
                        {Array.from({ length: 6 }).map((_, r) => (
                            <div key={r} className="flex items-center gap-4 border-b border-ink/10 px-3 py-3.5 last:border-b-0 sm:gap-6 sm:px-5">
                                <Skeleton className="h-[13.5px] w-32" />
                                <Skeleton tone="soft" className="ml-auto hidden h-3 w-16 md:block" />
                                <Skeleton tone="outline" className="ml-auto h-6 w-11 rounded-pill md:ml-0" />
                                <Skeleton tone="outline" className="h-11 w-11 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </SkeletonGroup>
    );
}
