import { ADMIN_ORDERS } from "./orders";
import { extractLocation } from "./location";

export type ChartRange = "7d" | "30d" | "90d";

export type TrendPoint = { label: string; value: number };

export type LocationTrendPoint = { label: string; values: Record<string, number> };

// Derived from the real mock addresses rather than hand-listed, so the chart's
// series can never drift from the orders they claim to summarise. Ordered by
// order volume (ties alphabetically) — a stable, meaningful series order.
export const SALES_LOCATIONS: string[] = (() => {
    const volume = new Map<string, number>();
    for (const order of ADMIN_ORDERS) {
        const location = extractLocation(order.address);
        volume.set(location, (volume.get(location) ?? 0) + 1);
    }
    return [...volume.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([location]) => location);
})();

// Illustrative per-location sales datasets — deliberately hand-authored rather
// than aggregated from ADMIN_ORDERS, which holds barely a dozen orders spread
// across two months and would leave most buckets empty at this granularity.
// Only the location keys are real (see SALES_LOCATIONS above); the peso
// figures stand in for what an analytics rollup would return.
// TODO: replace with a real per-location sales rollup from the backend.
export const SALES_TREND_BY_LOCATION_RANGE: Record<ChartRange, LocationTrendPoint[]> = {
    "7d": [
        { label: "Mon", values: { "Quezon City": 5200, "Mandaluyong City": 3100, "Marikina City": 2600, "Bacoor, Cavite": 1500 } },
        { label: "Tue", values: { "Quezon City": 4100, "Mandaluyong City": 2200, "Marikina City": 3000, "Bacoor, Cavite": 1200 } },
        { label: "Wed", values: { "Quezon City": 6400, "Mandaluyong City": 3800, "Marikina City": 2900, "Bacoor, Cavite": 2100 } },
        { label: "Thu", values: { "Quezon City": 4800, "Mandaluyong City": 4200, "Marikina City": 2400, "Bacoor, Cavite": 1600 } },
        { label: "Fri", values: { "Quezon City": 7900, "Mandaluyong City": 4600, "Marikina City": 3900, "Bacoor, Cavite": 2400 } },
        { label: "Sat", values: { "Quezon City": 8900, "Mandaluyong City": 4100, "Marikina City": 5200, "Bacoor, Cavite": 2700 } },
        { label: "Sun", values: { "Quezon City": 7800, "Mandaluyong City": 4900, "Marikina City": 4400, "Bacoor, Cavite": 2200 } },
    ],
    "30d": [
        { label: "Wk 1", values: { "Quezon City": 28400, "Mandaluyong City": 16800, "Marikina City": 14900, "Bacoor, Cavite": 8100 } },
        { label: "Wk 2", values: { "Quezon City": 31200, "Mandaluyong City": 17500, "Marikina City": 17100, "Bacoor, Cavite": 8700 } },
        { label: "Wk 3", values: { "Quezon City": 26100, "Mandaluyong City": 19200, "Marikina City": 12400, "Bacoor, Cavite": 7300 } },
        { label: "Wk 4", values: { "Quezon City": 34800, "Mandaluyong City": 18100, "Marikina City": 19600, "Bacoor, Cavite": 9600 } },
    ],
    "90d": [
        { label: "Jun", values: { "Quezon City": 98600, "Mandaluyong City": 61200, "Marikina City": 52400, "Bacoor, Cavite": 28800 } },
        { label: "Jul", values: { "Quezon City": 112400, "Mandaluyong City": 64800, "Marikina City": 61900, "Bacoor, Cavite": 29400 } },
        { label: "Aug", values: { "Quezon City": 121800, "Mandaluyong City": 68300, "Marikina City": 63500, "Bacoor, Cavite": 33100 } },
    ],
};

export type TopProduct = { name: string; value: number };

export const TOP_PRODUCTS_BY_RANGE: Record<ChartRange, TopProduct[]> = {
    "7d": [
        { name: "Overnight Retinol Serum", value: 14 },
        { name: "Quiet Glow Gel Cream", value: 11 },
        { name: "Vitamin C Brightening Drop", value: 9 },
        { name: "Barrier Repair Cream", value: 6 },
    ],
    "30d": [
        { name: "Quiet Glow Gel Cream", value: 52 },
        { name: "Overnight Retinol Serum", value: 47 },
        { name: "Niacinamide Pore Refiner", value: 38 },
        { name: "Vitamin C Brightening Drop", value: 33 },
        { name: "Barrier Repair Cream", value: 24 },
    ],
    "90d": [
        { name: "Quiet Glow Gel Cream", value: 168 },
        { name: "Overnight Retinol Serum", value: 151 },
        { name: "Vitamin C Brightening Drop", value: 112 },
        { name: "Niacinamide Pore Refiner", value: 97 },
        { name: "Barrier Repair Cream", value: 84 },
        { name: "The Ritual Edit, Full Set", value: 61 },
    ],
};
