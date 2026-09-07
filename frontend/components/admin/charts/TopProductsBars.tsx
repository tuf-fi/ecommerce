"use client";

import { useId } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TopProduct } from "@/library/admin/dashboard";

const ROW_HEIGHT = 40;
const NAME_WIDTH = 200;
const NAME_MAX_CHARS = 26;

type TooltipEntry = { value?: number | string; payload?: TopProduct };
type ChartClickState = { activeLabel?: string | number };

function truncate(name: string): string {
    return name.length > NAME_MAX_CHARS ? `${name.slice(0, NAME_MAX_CHARS - 1)}…` : name;
}

function ProductTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    const units = Number(entry.value ?? 0);

    return (
        <div className="rounded bg-ink px-3 py-2 whitespace-nowrap shadow-card">
            <div className="text-[11.5px] text-grey-light">{entry.payload?.name}</div>
            <div className="font-mono text-[12px] font-medium text-white tabular-nums">
                {units} {units === 1 ? "unit" : "units"} sold
            </div>
        </div>
    );
}

export default function TopProductsBars({ data, onSelect }: { data: TopProduct[]; onSelect?: (name: string) => void }) {
    const fillId = `topProductsFill-${useId().replace(/:/g, "")}`;

    if (!data.length) return null;

    return (
        <ResponsiveContainer width="100%" height={data.length * ROW_HEIGHT}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
                barCategoryGap="45%"
                onClick={(state: ChartClickState) => {
                    if (state?.activeLabel != null) onSelect?.(String(state.activeLabel));
                }}
                className={onSelect ? "cursor-pointer" : undefined}
            >
                <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--color-blue-soft)" />
                        <stop offset="100%" stopColor="var(--color-pink)" />
                    </linearGradient>
                </defs>
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis
                    type="category"
                    dataKey="name"
                    width={NAME_WIDTH}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={truncate}
                    tick={{ fill: "var(--color-ink)", fontSize: 12.5, fontFamily: "var(--font-space-grotesk), sans-serif" }}
                />
                <Tooltip cursor={{ fill: "var(--color-off)", fillOpacity: 0.7 }} content={<ProductTooltip />} wrapperStyle={{ outline: "none", zIndex: 20 }} />
                <Bar dataKey="value" fill={`url(#${fillId})`} radius={[0, 4, 4, 0]} maxBarSize={8} animationDuration={700}>
                    <LabelList
                        dataKey="value"
                        position="right"
                        offset={12}
                        fill="var(--color-grey)"
                        fontSize={12}
                        fontFamily="var(--font-ibm-plex-mono), monospace"
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
