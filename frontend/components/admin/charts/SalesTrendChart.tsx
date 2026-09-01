"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TrendPoint } from "@/library/admin/dashboard";

const WIDTH = 600;
const HEIGHT = 200;
const PAD = 24;
const DRAW_SECONDS = 1.1;

export default function SalesTrendChart({ data }: { data: TrendPoint[] }) {
    const [hover, setHover] = useState<number | null>(null);
    const lineRef = useRef<SVGPathElement>(null);
    const [lineLength, setLineLength] = useState(0);
    const [drawn, setDrawn] = useState(false);

    const max = Math.max(...data.map((d) => d.value)) * 1.15;
    const stepX = (WIDTH - PAD * 2) / (Math.max(data.length - 1, 1));

    const points = data.map((d, i) => ({
        x: PAD + i * stepX,
        y: HEIGHT - PAD - (d.value / max) * (HEIGHT - PAD * 2),
        ...d,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const areaPath = `${linePath} L${points[points.length - 1].x},${HEIGHT - PAD} L${points[0].x},${HEIGHT - PAD} Z`;

    useLayoutEffect(() => {
        setLineLength(lineRef.current?.getTotalLength() ?? 0);
        setDrawn(false);
    }, [linePath]);

    // rAF gives the "hidden" state above a real paint before flipping to
    // revealed, so the transition below has something to animate from.
    useEffect(() => {
        if (lineLength === 0) return;
        const raf = requestAnimationFrame(() => setDrawn(true));
        return () => cancelAnimationFrame(raf);
    }, [lineLength]);

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: 220 }}>
                <defs>
                    <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-pink)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="var(--color-pink)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* The area fill wipes in sync with the line via a left-anchored
                    clip — same duration/easing as the stroke-dashoffset reveal
                    below, so both read as one left-to-right sweep. */}
                <path
                    d={areaPath}
                    fill="url(#salesTrendFill)"
                    style={{
                        clipPath: drawn ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                        // Gated on `drawn`, same reasoning as the line below: on a
                        // fresh mount there's no prior painted style to animate
                        // from, so an unconditional transition here is harmless —
                        // but on a filter change this same element is reused
                        // (not remounted), so setting drawn back to false to hide
                        // it again would itself animate as a "wipe out", then get
                        // cut short the instant the reveal re-triggers. Keeping
                        // transition off until drawn is true makes the hide step
                        // instant and the reveal the only thing that animates —
                        // in sync with the line on every trigger, not just mount.
                        transition: drawn ? `clip-path ${DRAW_SECONDS}s cubic-bezier(.4,0,.2,1)` : "none",
                    }}
                />
                <path
                    ref={lineRef}
                    d={linePath}
                    fill="none"
                    stroke="var(--color-pink)"
                    strokeWidth="2"
                    style={{
                        strokeDasharray: lineLength,
                        strokeDashoffset: drawn ? 0 : lineLength,
                        // Gated on `drawn`, not `lineLength`: the render that first
                        // measures the path's length also moves dashoffset from 0
                        // (its initial, pre-measurement value) up to lineLength to
                        // establish the hidden state. If transition were already
                        // active for that render (as it was when gated on
                        // `lineLength`, which turns truthy in that same render),
                        // THAT setup step would itself animate — and get cut off the
                        // instant `drawn` flips true, which is what made the real
                        // reveal look like it never played.
                        transition: drawn ? `stroke-dashoffset ${DRAW_SECONDS}s cubic-bezier(.4,0,.2,1)` : "none",
                    }}
                />
                {points.map((p, i) => {
                    // Each dot pops in right as the sweep reaches its x position.
                    const delay = (i / Math.max(points.length - 1, 1)) * DRAW_SECONDS;
                    return (
                        <circle
                            key={p.label}
                            cx={p.x}
                            cy={p.y}
                            r={hover === i ? 5 : 3.5}
                            fill="var(--color-pink-dark)"
                            className="cursor-pointer"
                            style={{
                                opacity: drawn ? 1 : 0,
                                transformBox: "fill-box",
                                transformOrigin: "center",
                                transform: drawn ? "scale(1)" : "scale(0.3)",
                                transition: `opacity 0.3s ease ${delay}s, transform 0.3s ease ${delay}s, r 0.15s ease`,
                            }}
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(null)}
                        />
                    );
                })}
                {points.map((p) => (
                    <text key={p.label} x={p.x} y={HEIGHT - 4} textAnchor="middle" className="fill-grey font-mono" style={{ fontSize: 10 }}>
                        {p.label}
                    </text>
                ))}
            </svg>
            {hover !== null && (
                <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] rounded bg-ink px-2.5 py-1.5 font-mono text-[11px] whitespace-nowrap text-white"
                    style={{ left: `${(points[hover].x / WIDTH) * 100}%`, top: `${(points[hover].y / HEIGHT) * 100}%` }}
                >
                    ₱{points[hover].value.toLocaleString()}
                </div>
            )}
        </div>
    );
}
