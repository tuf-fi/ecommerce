export type ChartRange = "7d" | "30d" | "90d";

export type TrendPoint = { label: string; value: number };

// Illustrative sales-trend datasets per range — not derived from the small
// mock order set, same role as a real analytics rollup would play later.
export const SALES_TREND_BY_RANGE: Record<ChartRange, TrendPoint[]> = {
    "7d": [
        { label: "Mon", value: 12400 },
        { label: "Tue", value: 9800 },
        { label: "Wed", value: 15200 },
        { label: "Thu", value: 11600 },
        { label: "Fri", value: 18900 },
        { label: "Sat", value: 21300 },
        { label: "Sun", value: 18420 },
    ],
    "30d": [
        { label: "Wk 1", value: 68200 },
        { label: "Wk 2", value: 74500 },
        { label: "Wk 3", value: 61800 },
        { label: "Wk 4", value: 82100 },
    ],
    "90d": [
        { label: "Jun", value: 241000 },
        { label: "Jul", value: 268500 },
        { label: "Aug", value: 286700 },
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
