"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AdminProduct } from "@/library/admin/types";
import { productStockStatus } from "@/library/admin/products";

// Deliberate chart-only accent trio, distinct from the brand's UI accent colors.
const COLOR_IN = "#4C7EF3";
const COLOR_LOW = "#FFC531";
const COLOR_OUT = "#FF5C8D";

const DONUT_SIZE = 150;

type StockStatus = "in" | "low" | "out";
type StockRow = { key: StockStatus; label: string; value: number; color: string };
type TooltipEntry = { value?: number | string; payload?: StockRow };

function StockTooltip({ active, payload, total }: { active?: boolean; payload?: TooltipEntry[]; total: number }) {
    if (!active || !payload?.length) return null;
    const row = payload[0];
    const count = Number(row.value ?? 0);

    return (
        <div className="rounded bg-ink px-3 py-2 whitespace-nowrap shadow-card">
            <div className="text-[11.5px] text-grey-light">{row.payload?.label}</div>
            <div className="font-mono text-[12px] font-medium text-white tabular-nums">
                {count} of {total} ({Math.round((count / total) * 100)}%)
            </div>
        </div>
    );
}

export default function StockHealthDonut({
    products,
    onSelect,
}: {
    products: AdminProduct[];
    onSelect?: (status: StockStatus) => void;
}) {
    const counts = { in: 0, low: 0, out: 0 };
    products.forEach((p) => counts[productStockStatus(p)]++);
    const total = products.length || 1;

    const rows: StockRow[] = [
        { key: "in", label: "In Stock", value: counts.in, color: COLOR_IN },
        { key: "low", label: "Low Stock", value: counts.low, color: COLOR_LOW },
        { key: "out", label: "Out of Stock", value: counts.out, color: COLOR_OUT },
    ];

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Pie's onClick has no keyboard equivalent, so it's hidden from assistive tech; the legend below is the real control. */}
            <div aria-hidden className="relative" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={rows}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={72}
                            // Surface shows between slices instead of a stroke.
                            paddingAngle={2}
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                            animationDuration={900}
                            onClick={(entry) => onSelect?.((entry as unknown as { payload: StockRow }).payload.key)}
                        >
                            {rows.map((row) => (
                                <Cell key={row.key} fill={row.color} className={onSelect ? "cursor-pointer outline-none" : "outline-none"} />
                            ))}
                        </Pie>
                        <Tooltip content={<StockTooltip total={total} />} wrapperStyle={{ outline: "none", zIndex: 20 }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-display text-[22px] font-semibold text-ink">{products.length}</div>
                    <div className="font-mono text-[9px] tracking-[.06em] text-grey uppercase">Products</div>
                </div>
            </div>

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
