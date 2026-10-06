"use client";

import { useRouter } from "next/navigation";

// Goes back when there is history to return to, otherwise falls back to the homepage.
export default function BackLink() {
    const router = useRouter();

    return (
        <button
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className="group mb-8 inline-flex min-h-11 items-center gap-2 text-[12.5px] font-medium text-grey transition-colors hover:text-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 md:mb-10"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back
        </button>
    );
}
