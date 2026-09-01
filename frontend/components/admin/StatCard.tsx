"use client";

import { useEffect, useState } from "react";

function useCountUp(target: number, duration = 900) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let frame: number;
        const start = performance.now();
        function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return value;
}

export default function StatCard({
    label,
    value,
    prefix = "",
    delta,
    down = false,
    onClick,
    valueClassName,
}: {
    label: string;
    value: number;
    prefix?: string;
    delta?: string;
    down?: boolean;
    onClick?: () => void;
    valueClassName?: string;
}) {
    const animated = useCountUp(value);

    return (
        <button
            onClick={onClick}
            className={`border border-ink/10 bg-white px-5.5 py-5 text-left transition ${
                onClick ? "cursor-pointer hover:border-ink/20 hover:bg-off/40" : "cursor-default"
            }`}
        >
            <div className="mb-2.5 font-mono text-[10.5px] tracking-[.06em] text-grey uppercase">{label}</div>
            <div className={`font-display text-[28px] font-medium ${valueClassName ?? "text-ink"}`}>
                {prefix}
                {animated.toLocaleString()}
            </div>
            {delta && <div className={`mt-1.5 text-[11.5px] ${down ? "text-alert" : "text-success-dark"}`}>{delta}</div>}
        </button>
    );
}
