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
                <SkeletonGroup className="mx-auto max-w-[720px] py-4 md:py-10">
                    <Skeleton tone="soft" className="h-[10px] w-24" />
                    <Skeleton className="mt-4 mb-10 h-[34px] w-3/5 sm:h-[44px]" />
                    <Skeleton tone="soft" className="mb-3 h-3 w-full" />
                    <Skeleton tone="soft" className="mb-3 h-3 w-11/12" />
                    <Skeleton tone="soft" className="mb-3 h-3 w-4/5" />
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
