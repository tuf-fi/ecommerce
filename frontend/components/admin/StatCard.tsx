"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts";

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

// A shape, not a chart: no axes/grid/hover/tooltip — history stays muted so only the latest move carries accent weight.
function Sparkline({ points }: { points: number[] }) {
    const lastIndex = points.length - 1;
    const rows = points.map((value, i) => ({
        i,
        value,
        // Covers only the closing move, so the two lines meet rather than overlap.
        recent: i >= lastIndex - 1 ? value : null,
    }));

    return (
        <div className="mt-3 h-5 w-16" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
                    <XAxis dataKey="i" type="number" domain={[0, lastIndex]} hide />
                    <YAxis type="number" domain={[0, (max: number) => Math.max(max, 1)]} hide />
                    <Line
                        dataKey="value"
                        type="monotone"
                        stroke="var(--color-ink)"
                        strokeOpacity={0.2}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        dot={false}
                        isAnimationActive={false}
                    />
                    <Line
                        dataKey="recent"
                        type="monotone"
                        stroke="var(--color-pink-dark)"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        dot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                    />
                    <ReferenceDot x={lastIndex} y={points[lastIndex]} r={2} fill="var(--color-pink-dark)" stroke="none" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function StatCard({
    label,
    value,
    prefix = "",
    delta,
    down = false,
    onClick,
    valueClassName,
    sparkline,
    graph,
    control,
    className,
    tone = "light",
}: {
    label: string;
    value: number;
    prefix?: string;
    delta?: string;
    down?: boolean;
    onClick?: () => void;
    valueClassName?: string;
    sparkline?: number[];
    // A full-width real chart for the one hero card that carries one — distinct from `sparkline`.
    graph?: React.ReactNode;
    // Forces the card to render as a <div>, not a <button> — a <select> can't legally nest inside a button.
    control?: React.ReactNode;
    className?: string;
    // "navy"/"pink"/"mint" are the hero-row cards, solid-filled in their identity color to anchor them.
    tone?: "light" | "navy" | "pink" | "mint";
}) {
    const animated = useCountUp(value);
    const solid = tone !== "light";
    const bgClass =
        tone === "navy"
            ? "bg-navy"
            : tone === "pink"
              ? "bg-pink-btn"
              : tone === "mint"
                ? "bg-success"
                : "border border-ink/10 bg-white";
    const Container = control ? "div" : "button";

    return (
        <Container
            onClick={control ? undefined : onClick}
            className={`px-5.5 py-5 text-left shadow-card transition ${bgClass} ${
                onClick && !control ? `cursor-pointer hover:shadow-card-hover ${solid ? "" : "hover:border-ink/20"}` : "cursor-default"
            } ${className ?? ""}`}
        >
            <div className="mb-2.5 flex h-[15px] items-center justify-between gap-3">
                <span className={`font-mono text-[11px] tracking-[.06em] uppercase ${solid ? "text-white/75" : "text-grey"}`}>{label}</span>
                {control}
            </div>
            <div className={`font-display text-[28px] font-medium ${valueClassName ?? (solid ? "text-white" : "text-ink")}`}>
                {/* Explicit gap — the peso sign's crossbar reads as a strikethrough into the first digit without it. */}
                {prefix && <span className="mr-[3px]">{prefix}</span>}
                {animated.toLocaleString()}
            </div>
            {/* Fixed height even with no delta, to avoid resizing the hero row; red/green drops to white tint on solid tones for contrast. */}
            <div className={`mt-1.5 h-[16px] text-[11.5px] ${solid ? "text-white/90" : down ? "text-alert" : "text-success-dark"}`}>{delta}</div>
            {sparkline && sparkline.length > 1 && <Sparkline points={sparkline} />}
            {graph && <div className="mt-3 -mx-1.5">{graph}</div>}
        </Container>
    );
}
