"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

function Content() {
    const router = useRouter();
    const order = useSearchParams().get("order");

    // Opened without an order (typed in, or a refresh long after): nothing to confirm.
    useEffect(() => {
        if (!order) router.replace("/shop");
    }, [order, router]);

    if (!order) return null;

    return (
        <div className="mx-auto flex min-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px)-4rem)] max-w-[440px] flex-col items-center justify-center py-16 text-center">
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden="true">
                <path d="M10 25.5 19.5 35 38 13" />
            </svg>

            <h1 className="mt-8 mb-0 max-w-none font-display text-[clamp(32px,7vw,52px)] leading-[1.02] font-normal tracking-tight text-ink">
                Checkout is <em className="pink-highlight font-normal">successful.</em>
            </h1>
            <p className="mt-4 mb-0 max-w-[330px] text-[13.5px] leading-relaxed text-balance text-grey">We&apos;ll check your payment and confirm your order soon.</p>
            <p className="mt-5 mb-0 font-mono text-[11px] tracking-[.14em] text-grey uppercase">Order {order}</p>

            <Link
                href="/shop"
                className="mt-12 inline-flex h-12 w-full items-center justify-center bg-navy text-[12.5px] font-semibold tracking-[.06em] text-white uppercase transition hover:bg-pink-dark sm:w-[260px]"
            >
                Continue shopping
            </Link>
            <Link href="/account/purchases" className="mt-5 text-[12.5px] text-grey underline underline-offset-4 transition-colors hover:text-pink-dark">
                Go to my orders
            </Link>
        </div>
    );
}

// Shown while useSearchParams resolves; same centred column and sizes as the confirmation.
function SuccessSkeleton() {
    return (
        <SkeletonGroup className="mx-auto flex min-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px)-4rem)] max-w-[440px] flex-col items-center justify-center py-16">
            <Skeleton tone="outline" className="h-14 w-14 rounded-full" />
            <Skeleton className="mt-8 h-[36px] w-72 max-w-full sm:h-[52px]" />
            <Skeleton tone="soft" className="mt-4 h-[14px] w-64 max-w-full" />
            <Skeleton tone="soft" className="mt-5 h-[11px] w-32" />
            <Skeleton tone="outline" className="mt-12 h-12 w-full sm:w-[260px]" />
            <Skeleton tone="soft" className="mt-5 h-[13px] w-28" />
        </SkeletonGroup>
    );
}

export default function CheckoutSuccessView() {
    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+1.2rem)] pb-16">
            <Suspense fallback={<SuccessSkeleton />}>
                <Content />
            </Suspense>
        </div>
    );
}
