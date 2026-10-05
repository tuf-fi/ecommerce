"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendPoint } from "@/library/admin/dashboard";

const HEIGHT = 96;

// Plain-white variant only: --color-alert reads too close to pink-dark, so "down" uses --color-amber instead.
const POSITIVE = "var(--color-success)";
const NEGATIVE = "var(--color-amber)";
// Kept subtle on purpose — a heavier glow read as a muddy blur instead of a clean line.
const GLOW_POSITIVE = "rgba(34, 122, 76, 0.22)";
const GLOW_NEGATIVE = "rgba(242, 153, 74, 0.2)";

// On solid-fill hero cards the brand green/amber nearly vanish, so both directions share one near-white line (with a dark drop-shadow) and let the delta text's "+"/"-" carry the signal instead.
const SOLID_LINE = "rgba(255, 255, 255, 0.95)";
const SOLID_GLOW = "rgba(0, 0, 0, 0.22)";

type TooltipEntry = { value?: number | string };

function HeroTooltip({ active, payload, label, formatValue }: { active?: boolean; payload?: TooltipEntry[]; label?: string; formatValue: (v: number) => string }) {
    if (!active || !payload?.length) return null;
    const value = Number(payload[0].value ?? 0);

    return (
        <div className="rounded bg-white px-2.5 py-1.5 font-mono text-[11px] whitespace-nowrap text-ink shadow-card">
            <span className="text-grey">{label}</span>
            <span className="ml-2 font-medium">{formatValue(value)}</span>
        </div>
    );
}

// Recolored by trend direction, with a soft glow behind the stroke so it reads as the card's focal element.
export default function HeroTrendChart({
    data,
    positive,
    formatValue = (v) => v.toLocaleString(),
    onSolid = true,
}: {
    data: TrendPoint[];
    positive: boolean;
    formatValue?: (value: number) => string;
    // True on solid-tone StatCards (navy/pink/mint); false for the plain white card variant.
    onSolid?: boolean;
}) {
    const fillId = `heroTrendFill-${useId().replace(/:/g, "")}`;
    const color = onSolid ? SOLID_LINE : positive ? POSITIVE : NEGATIVE;
    const glow = onSolid ? SOLID_GLOW : positive ? GLOW_POSITIVE : GLOW_NEGATIVE;

    if (data.length < 2) return null;

    return (
        <ResponsiveContainer width="100%" height={HEIGHT}>
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={onSolid ? 0.3 : 0.16} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={[0, (max: number) => Math.max(max, 1) * 1.15]} />
                <Tooltip
                    cursor={{ stroke: onSolid ? "rgba(255,255,255,0.4)" : "var(--color-ink)", strokeOpacity: onSolid ? 1 : 0.15, strokeWidth: 1 }}
                    content={<HeroTooltip formatValue={formatValue} />}
                    wrapperStyle={{ outline: "none", zIndex: 20 }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={`url(#${fillId})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: onSolid ? "rgba(0,0,0,0.3)" : "#FFFFFF" }}
                    animationDuration={900}
                    style={{ filter: `drop-shadow(0 1px 2px ${glow})` }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
