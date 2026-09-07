"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendPoint } from "@/library/admin/dashboard";

const HEIGHT = 64;

// Chart-blue, from the same validated categorical palette as SalesTrendChart —
// deliberately not the Sales Trend pink, so this doesn't read as a shrunken
// copy of the chart above it.
const LINE_COLOR = "#1F5FA8";

type TooltipEntry = { value?: number | string };

function OrdersTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
    if (!active || !payload?.length) return null;
    const count = Number(payload[0].value ?? 0);

    return (
        <div className="rounded bg-ink px-2.5 py-1.5 font-mono text-[11px] whitespace-nowrap text-white shadow-card">
            <span className="text-grey-light">{label}</span>
            <span className="ml-2">
                {count} {count === 1 ? "order" : "orders"}
            </span>
        </div>
    );
}

export default function OrdersTrendSparkline({ data }: { data: TrendPoint[] }) {
    const fillId = `ordersTrendFill-${useId().replace(/:/g, "")}`;

    if (data.length < 2) return null;

    return (
        <ResponsiveContainer width="100%" height={HEIGHT}>
            <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={[0, (max: number) => Math.max(max, 1) * 1.25]} />
                <Tooltip
                    cursor={{ stroke: "var(--color-ink)", strokeOpacity: 0.18, strokeWidth: 1 }}
                    content={<OrdersTooltip />}
                    wrapperStyle={{ outline: "none", zIndex: 20 }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={LINE_COLOR}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={`url(#${fillId})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                    animationDuration={800}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
