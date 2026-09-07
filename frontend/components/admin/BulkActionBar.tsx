"use client";

// Shared sticky action bar for table multi-select — appears once at least one
// row is checked, on Orders/Inventory/Staff. Kept as one component so all
// three tables get the exact same look and the same Escape-to-clear behavior,
// rather than three bespoke bars drifting apart over time.
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
        <div className="sticky bottom-4 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 border border-ink/10 border-t-2 border-t-pink-btn bg-navy px-5 py-3.5 text-white">
            <div className="flex items-center gap-3">
                <span className="font-mono text-[11.5px] tracking-[.1em] uppercase">
                    {count} selected
                </span>
                <button
                    onClick={onClear}
                    className="text-[12.5px] text-white/70 underline decoration-white/30 underline-offset-2 transition hover:text-white hover:decoration-white"
                >
                    Clear
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">{children}</div>
        </div>
    );
}
