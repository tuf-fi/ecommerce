"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LocationTrendPoint } from "@/library/admin/dashboard";

// Four lines is the ceiling where a shared crosshair tooltip still reads at a glance; beyond that, locations fold into one "Other" line.
const MAX_SERIES = 4;
const OTHER_LABEL = "Other";

// Keyed by location rather than by position, so a location keeps its colour even if SALES_LOCATIONS' ordering shifts.
const LOCATION_COLORS: Record<string, string> = {
    "Quezon City": "#A81753",
    "Marikina City": "#1F5FA8",
    "Mandaluyong City": "#2A9D8F",
    "Bacoor, Cavite": "#6B4FA0",
};

const FALLBACK_COLORS = ["#A81753", "#1F5FA8", "#2A9D8F", "#6B4FA0"];

const MONO_TICK = { fill: "var(--color-grey)", fontSize: 10, fontFamily: "var(--font-ibm-plex-mono), monospace" };

type Series = { name: string; color: string };

type TooltipEntry = { dataKey?: string | number; value?: number | string };

function pesoTick(value: number): string {
    return value >= 1000 ? `₱${Math.round(value / 1000)}k` : `₱${value}`;
}

function SalesTooltip({ active, payload, label, colorOf }: { active?: boolean; payload?: TooltipEntry[]; label?: string; colorOf: (name: string) => string }) {
    if (!active || !payload?.length) return null;

    const rows = payload
        .map((entry) => ({ name: String(entry.dataKey ?? ""), value: Number(entry.value ?? 0) }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="rounded bg-ink px-3 py-2 whitespace-nowrap shadow-card">
            <div className="mb-1.5 font-mono text-[10px] tracking-[.08em] text-grey-light uppercase">{label}</div>
            {rows.map((row) => (
                <div key={row.name} className="flex items-center gap-2.5 py-[1px]">
                    <span className="h-[2px] w-3 flex-none rounded-full" style={{ backgroundColor: colorOf(row.name) }} />
                    <span className="flex-1 text-[11px] text-grey-light">{row.name}</span>
                    <span className="font-mono text-[11.5px] font-medium text-white tabular-nums">₱{row.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
}

// Rendered as a plain flow block rather than recharts' own <Legend>, which reserves a fixed height that's too short once this wraps to a second line at narrower widths.
function LineKeyLegend({ series }: { series: Series[] }) {
    return (
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {series.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5">
                    <span className="h-[2px] w-4 flex-none rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-mono text-[10.5px] tracking-[.06em] text-ink uppercase">{s.name}</span>
                </span>
            ))}
        </div>
    );
}

export default function SalesTrendChart({ data, locations }: { data: LocationTrendPoint[]; locations: string[] }) {
    const { series, rows } = useMemo(() => {
        const withinCap = locations.length <= MAX_SERIES;
        const named = withinCap ? locations : locations.slice(0, MAX_SERIES - 1);
        const bucketed = withinCap ? [] : locations.slice(MAX_SERIES - 1);

        const list: Series[] = named.map((name, i) => ({
            name,
            color: LOCATION_COLORS[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }));
        if (bucketed.length) list.push({ name: OTHER_LABEL, color: FALLBACK_COLORS[MAX_SERIES - 1] });

        const flattened = data.map((point) => {
            const row: Record<string, string | number> = { label: point.label };
            for (const name of named) row[name] = point.values[name] ?? 0;
            if (bucketed.length) row[OTHER_LABEL] = bucketed.reduce((sum, name) => sum + (point.values[name] ?? 0), 0);
            return row;
        });

        return { series: list, rows: flattened };
    }, [data, locations]);

    const colorOf = (name: string) => series.find((s) => s.name === name)?.color ?? FALLBACK_COLORS[0];

    if (!rows.length || !series.length) return null;

    return (
        <div>
            <LineKeyLegend series={series} />
            <ResponsiveContainer width="100%" height={206}>
                <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-ink)" strokeOpacity={0.07} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={MONO_TICK} dy={6} />
                    <YAxis tickLine={false} axisLine={false} tick={MONO_TICK} tickFormatter={pesoTick} width={54} />
                    <Tooltip
                        cursor={{ stroke: "var(--color-ink)", strokeOpacity: 0.18, strokeWidth: 1 }}
                        content={<SalesTooltip colorOf={colorOf} />}
                        wrapperStyle={{ outline: "none", zIndex: 20 }}
                    />
                    {series.map((s, i) => (
                        <Line
                            key={s.name}
                            type="monotone"
                            dataKey={s.name}
                            stroke={s.color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                            animationDuration={900}
                            // Staggered so four simultaneous reveals don't read as one blur.
                            animationBegin={i * 120}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
