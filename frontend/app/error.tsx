"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

// Shown when a page throws while rendering; `reset` retries without a full reload.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div role="alert" className="-mx-[var(--gutter)] flex min-h-screen w-[calc(100%+var(--gutter)*2)] flex-col justify-center bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+3rem)] pb-24">
            <div className="max-w-[560px]">
                <span className="mb-6 block font-mono text-label uppercase tracking-[.16em] text-grey">Something went wrong</span>
                <h1 className="mb-4 text-[clamp(30px,5vw,46px)] leading-[1.05]">We couldn&apos;t load this page.</h1>
                <p className="m-0 mb-8 max-w-[420px] text-small leading-relaxed text-grey">Nothing you did caused this. Try again, and if it keeps happening, head back to the shop.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={reset} className={buttonClass({ variant: "primary" })}>
                        Try again
                    </button>
                    <Link href="/shop" className={buttonClass({ variant: "secondary" })}>
                        Back to the shop
                    </Link>
                </div>
            </div>
        </div>
    );
}
