"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendPoint } from "@/library/admin/dashboard";

const HEIGHT = 96;

// Shared by both hero StatCards (Revenue's navy border, New Users' pink-dark
// border) — the brand's own --color-alert is a dark rose too close to the
// pink-dark accent border to read as a distinct signal next to it, so "down"
// gets a chart-only warm amber instead.
const POSITIVE = "var(--color-success)";
const NEGATIVE = "#F2994A";
const GLOW_POSITIVE = "rgba(34, 122, 76, 0.6)";
const GLOW_NEGATIVE = "rgba(242, 153, 74, 0.55)";

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

// The line + gradient-area shape from the original single-series Sales Trend
// chart, recolored by trend direction — green when the period is up, amber
// when it's down — with a soft glow behind the stroke so it reads as the
// focal element of the card, not just another chart.
export default function HeroTrendChart({
    data,
    positive,
    formatValue = (v) => v.toLocaleString(),
}: {
    data: TrendPoint[];
    positive: boolean;
    formatValue?: (value: number) => string;
}) {
    const fillId = `heroTrendFill-${useId().replace(/:/g, "")}`;
    const color = positive ? POSITIVE : NEGATIVE;
    const glow = positive ? GLOW_POSITIVE : GLOW_NEGATIVE;

    if (data.length < 2) return null;

    return (
        <ResponsiveContainer width="100%" height={HEIGHT}>
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={[0, (max: number) => Math.max(max, 1) * 1.15]} />
                <Tooltip
                    cursor={{ stroke: "var(--color-ink)", strokeOpacity: 0.15, strokeWidth: 1 }}
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
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#FFFFFF" }}
                    animationDuration={900}
                    style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
