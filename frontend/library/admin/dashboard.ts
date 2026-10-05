import type { AdminOrder } from "./types";
import { extractLocation } from "./location";
import { orderTotal } from "./orders";
import { getProduct } from "../products";

export type ChartRange = "7d" | "30d" | "90d";

export type TrendPoint = { label: string; value: number };

export type LocationTrendPoint = { label: string; values: Record<string, number> };

export type TopProduct = { name: string; value: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<ChartRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
// Daily points for a week, then wider buckets so a quarter doesn't draw ninety points.
const RANGE_BUCKETS: Record<ChartRange, number> = { "7d": 7, "30d": 6, "90d": 6 };

// Cancelled orders aren't sales. Computed from the orders already loaded in the admin, so there is no separate rollup to drift.
const sales = (orders: AdminOrder[]) => orders.filter((o) => o.status !== "Cancelled" && o.createdAt);

function startOfToday(): number {
    return new Date().setHours(0, 0, 0, 0);
}

// Places ordered by how many orders they have, busiest first — the chart's series.
export function salesLocations(orders: AdminOrder[]): string[] {
    const volume = new Map<string, number>();
    for (const order of sales(orders)) {
        const location = extractLocation(order.address);
        volume.set(location, (volume.get(location) ?? 0) + 1);
    }
    return [...volume.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([location]) => location);
}

// Revenue per place, per day (or per few days for the longer ranges), oldest first.
export function salesTrendByLocation(orders: AdminOrder[], range: ChartRange): LocationTrendPoint[] {
    const days = RANGE_DAYS[range];
    const buckets = RANGE_BUCKETS[range];
    const size = days / buckets;
    const start = startOfToday() - (days - 1) * DAY_MS;

    const points: LocationTrendPoint[] = Array.from({ length: buckets }, (_, i) => {
        const from = new Date(start + i * size * DAY_MS);
        return {
            label: range === "7d" ? from.toLocaleDateString("en-US", { weekday: "short" }) : from.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            values: {},
        };
    });
    for (const order of sales(orders)) {
        const index = Math.floor((new Date(order.createdAt!).getTime() - start) / (size * DAY_MS));
        if (index < 0 || index >= buckets) continue;
        const location = extractLocation(order.address);
        points[index].values[location] = (points[index].values[location] ?? 0) + orderTotal(order);
    }
    return points;
}

export function hasSales(points: LocationTrendPoint[]): boolean {
    return points.some((p) => Object.values(p.values).some((v) => v > 0));
}

// Units sold per product in the range, best first.
export function topProducts(orders: AdminOrder[], range: ChartRange, limit = 6): TopProduct[] {
    const since = startOfToday() - (RANGE_DAYS[range] - 1) * DAY_MS;
    const units = new Map<number, { name: string; value: number }>();
    for (const order of sales(orders)) {
        if (new Date(order.createdAt!).getTime() < since) continue;
        for (const item of order.items) {
            const entry = units.get(item.productId) ?? { name: getProduct(item.productId)?.title ?? item.name ?? "Product", value: 0 };
            entry.value += item.qty;
            units.set(item.productId, entry);
        }
    }
    return [...units.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, limit);
}
