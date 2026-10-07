"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LegalPage from "@/components/pages/LegalPage";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import { useContent } from "@/library/content";
import { useStore } from "@/library/store";

// Signed-in customers read these inside the account area (sidebar included); everyone else gets the standalone page.
export default function PublicPolicyRoute({ slug }: { slug: "privacy-policy" | "terms" | "shipping-returns" }) {
    const { pages } = useContent();
    const { sessionChecked, isLoggedIn } = useStore();
    const router = useRouter();
    const page = pages.find((p) => p.slug === slug);

    useEffect(() => {
        if (sessionChecked && isLoggedIn) router.replace(`/account/${slug}`);
    }, [sessionChecked, isLoggedIn, slug, router]);

    const shell = "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+1.2rem)] pb-20";

    if (!sessionChecked || isLoggedIn || !page) {
        return (
            <div className={shell}>
                <SkeletonGroup className="mx-auto max-w-[1040px]">
                    <div className="mb-8 flex min-h-11 items-center md:mb-10">
                        <Skeleton className="h-[12.5px] w-14" />
                    </div>
                    <div className="mb-8 border-b border-ink/10 pb-8 md:mb-12 md:pb-10">
                        <Skeleton className="h-[32px] w-3/5 max-w-[420px] sm:h-[40px] lg:h-[48px]" />
                    </div>

                    <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
                        <div className="hidden lg:block">
                            <Skeleton tone="soft" className="mb-4 h-[10px] w-24" />
                            <div className="flex flex-col gap-3 border-l border-ink/10 pl-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-3 w-4/5" />
                                ))}
                            </div>
                        </div>

                        <div className="max-w-[72ch]">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className={`border-t border-ink/10 pt-8 ${i === 0 ? "" : "mt-10"}`}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <Skeleton tone="soft" className="h-[11px] w-4" />
                                        <Skeleton className="h-[18px] w-40" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Skeleton tone="soft" className="h-3 w-full" />
                                        <Skeleton tone="soft" className="h-3 w-11/12" />
                                        <Skeleton tone="soft" className="h-3 w-4/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SkeletonGroup>
            </div>
        );
    }

    return (
        <div className={shell}>
            <LegalPage page={page} />
        </div>
    );
}
