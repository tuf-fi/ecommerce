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

// A stat-tile sparkline is a shape, not a chart: no axes, no grid, no hover,
// no tooltip. The history stays muted so only the latest move carries accent
// weight — the number above it is what the reader is here for.
function Sparkline({ points }: { points: number[] }) {
    const lastIndex = points.length - 1;
    const rows = points.map((value, i) => ({
        i,
        value,
        // The accent stroke covers only the closing move, so the two lines meet
        // rather than overlap.
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
    // A full-width chart for the one hero card that carries one (e.g.
    // Revenue) — distinct from `sparkline`, which is a plain shape with no
    // axes/hover, not a real chart.
    graph?: React.ReactNode;
    // An interactive control (e.g. a range <select>) next to the label.
    // Forces the card to render as a <div> rather than a <button> — a
    // <select> can't legally nest inside a <button>, and a card that hosts
    // its own control has no business being a single big click target too.
    control?: React.ReactNode;
    // The card is the grid item itself, so span/placement classes belong here
    // rather than on a wrapper that would just add a layer.
    className?: string;
    // "navy"/"pink" are the hero cards in a row (Revenue, New Users) that
    // visually anchor it — a hairline border plus a soft tinted fill in the
    // card's identity color, so they read as distinct from the plain white
    // cards without breaking from the flat hairline-border system.
    tone?: "light" | "navy" | "pink";
}) {
    const animated = useCountUp(value);
    const bgClass =
        tone === "navy" ? "border border-navy/25 bg-blue-soft" : tone === "pink" ? "border border-pink-dark/25 bg-pink-soft" : "border border-ink/10 bg-white";
    const Container = control ? "div" : "button";

    return (
        <Container
            onClick={control ? undefined : onClick}
            className={`px-5.5 py-5 text-left shadow-card transition ${bgClass} ${
                onClick && !control ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover hover:border-ink/20" : "cursor-default"
            } ${className ?? ""}`}
        >
            <div className="mb-2.5 flex items-center justify-between gap-3">
                <span className="font-mono text-[10.5px] tracking-[.06em] uppercase text-grey">{label}</span>
                {control}
            </div>
            <div className={`font-display text-[28px] font-medium ${valueClassName ?? "text-ink"}`}>
                {/* The peso sign's own crossbar reads as a strikethrough into
                    the first digit at this size/weight when set flush against
                    it — a small explicit gap keeps the glyph and the number
                    visually separate instead of relying on the font's (here,
                    too-tight) side bearing. */}
                {prefix && <span className="mr-[3px]">{prefix}</span>}
                {animated.toLocaleString()}
            </div>
            {delta && <div className={`mt-1.5 text-[11.5px] ${down ? "text-alert" : "text-success-dark"}`}>{delta}</div>}
            {sparkline && sparkline.length > 1 && <Sparkline points={sparkline} />}
            {graph && <div className="mt-3 -mx-1.5">{graph}</div>}
        </Container>
    );
}
