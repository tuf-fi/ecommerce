"use client";

import { useEffect, useState } from "react";
import { AdminProduct } from "@/library/admin/types";
import { stockStatus } from "@/library/admin/products";

// Vivid, saturated hues chosen to pop off the white card — a deliberate
// chart-only accent trio (blue/yellow/pink) distinct from the brand's
// UI accent colors, not a muted tint of success/pink/alert.
const COLOR_IN = "#4C7EF3";
const COLOR_LOW = "#FFC531";
const COLOR_OUT = "#FF5C8D";

// A fresh instance per `key` (the parent keys this by the target percentages),
// so the sweep-in animation replays on every count change with no need to
// reset state mid-lifecycle — it simply mounts already-at-zero every time.
function DonutRing({ inTarget, lowTarget, total }: { inTarget: number; lowTarget: number; total: number }) {
    const [animated, setAnimated] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setAnimated(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const inEnd = animated ? inTarget : 0;
    const lowEnd = animated ? lowTarget : 0;

    return (
        <div
            className="relative flex h-[140px] w-[140px] flex-none items-center justify-center rounded-full transition-transform hover:scale-105"
            style={
                {
                    "--donut-in-end": `${inEnd}%`,
                    "--donut-low-end": `${lowEnd}%`,
                    transition: "--donut-in-end 0.9s cubic-bezier(.4,0,.2,1), --donut-low-end 0.9s cubic-bezier(.4,0,.2,1)",
                    background: `conic-gradient(${COLOR_IN} 0% var(--donut-in-end), ${COLOR_LOW} var(--donut-in-end) var(--donut-low-end), ${COLOR_OUT} var(--donut-low-end) 100%)`,
                } as React.CSSProperties
            }
        >
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                <div className="font-display text-[22px] font-semibold text-ink">{total}</div>
                <div className="font-mono text-[9px] tracking-[.06em] text-grey uppercase">Products</div>
            </div>
        </div>
    );
}

export default function StockHealthDonut({
    products,
    onSelect,
}: {
    products: AdminProduct[];
    onSelect?: (status: "in" | "low" | "out") => void;
}) {
    const counts = { in: 0, low: 0, out: 0 };
    products.forEach((p) => counts[stockStatus(p.stock)]++);
    const total = products.length || 1;
    const inPct = (counts.in / total) * 100;
    const lowPct = (counts.low / total) * 100;

    const rows = [
        { key: "in" as const, label: "In Stock", value: counts.in, color: COLOR_IN },
        { key: "low" as const, label: "Low Stock", value: counts.low, color: COLOR_LOW },
        { key: "out" as const, label: "Out of Stock", value: counts.out, color: COLOR_OUT },
    ];

    return (
        <div className="flex flex-col items-center gap-5">
            <style>{`
                @property --donut-in-end { syntax: '<percentage>'; inherits: false; initial-value: 0%; }
                @property --donut-low-end { syntax: '<percentage>'; inherits: false; initial-value: 0%; }
            `}</style>
            <DonutRing key={`${inPct}-${lowPct}-${total}`} inTarget={inPct} lowTarget={inPct + lowPct} total={total} />
            <div className="flex w-full flex-col gap-1">
                {rows.map((r) => (
                    <button
                        key={r.key}
                        onClick={() => onSelect?.(r.key)}
                        className="flex items-center justify-between px-1.5 py-1.5 text-[12.5px] transition hover:bg-off"
                    >
                        <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: r.color }} />
                            {r.label}
                        </span>
                        <span className="font-mono text-ink">{r.value}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
