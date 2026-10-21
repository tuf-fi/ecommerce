"use client";

import { useEffect } from "react";

export default function BulkActionBar({
    count,
    onClear,
    children,
}: {
    count: number;
    onClear: () => void;
    children: React.ReactNode;
}) {
    useEffect(() => {
        if (count === 0) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClear();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [count, onClear]);

    if (count === 0) return null;

    return (
        <>
            {/* Keeps the last rows of the page from sitting under the fixed bar. */}
            <div aria-hidden className="h-20" />
            <div className="fixed right-5 bottom-4 left-5 z-30 bg-navy text-white shadow-modal transition-[left] duration-200 ease-in-out sm:right-10 sm:left-10 lg:left-[calc(var(--sidebar-w,0px)+2.5rem)]">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-label tracking-[.1em] uppercase">{count} selected</span>
                        <button
                            onClick={onClear}
                            className="text-meta text-white/70 underline decoration-white/30 underline-offset-2 transition hover:text-white hover:decoration-white"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">{children}</div>
                </div>
            </div>
        </>
    );
}
