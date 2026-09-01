"use client";

import { useEffect, useState } from "react";
import { TopProduct } from "@/library/admin/dashboard";

// A fresh instance per `key` (the parent keys this by the dataset itself), so
// the fill-in animation replays on every range change with no need to reset
// state mid-lifecycle — it simply mounts already-at-zero every time.
function Bars({ data, onSelect }: { data: TopProduct[]; onSelect?: (name: string) => void }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const [filled, setFilled] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setFilled(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <>
            {data.map((d, i) => (
                <button key={d.name} onClick={() => onSelect?.(d.name)} className="group mb-4 flex w-full items-center gap-3.5 text-left last:mb-0">
                    <span className="w-[190px] flex-none truncate font-display text-[12.5px] text-ink transition group-hover:text-pink-dark">
                        {d.name}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-off">
                        <span
                            className="block h-full rounded-full"
                            style={{
                                width: filled ? `${(d.value / max) * 100}%` : "0%",
                                background: "linear-gradient(90deg, var(--color-blue-soft), var(--color-pink))",
                                transition: `width 0.7s cubic-bezier(.4,0,.2,1) ${i * 0.06}s`,
                            }}
                        />
                    </span>
                    <span className="w-14 flex-none text-right font-mono text-[12px] text-grey">{d.value}</span>
                </button>
            ))}
        </>
    );
}

export default function TopProductsBars({ data, onSelect }: { data: TopProduct[]; onSelect?: (name: string) => void }) {
    return (
        <div>
            <Bars key={data.map((d) => d.name).join("|")} data={data} onSelect={onSelect} />
        </div>
    );
}
