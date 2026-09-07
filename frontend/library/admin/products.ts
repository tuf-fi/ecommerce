import { AdminProduct } from "./types";
import { PRODUCTS } from "../products";

// Deliberately varied stock levels (some low, some out) so the dashboard's
// stock-health donut and low-stock alerts have something real to show.
const STOCK_BY_ID: Record<number, number> = {
    1: 34, 2: 6, 3: 58, 4: 0, 5: 22, 6: 4, 7: 12, 8: 41,
    9: 3, 10: 27, 11: 0, 12: 19, 13: 8, 14: 63, 15: 15, 16: 2,
    17: 9, 18: 47, 19: 0, 20: 31, 21: 5, 22: 24, 23: 7, 24: 18,
};

const EXPIRY_BY_ID: Record<number, string | null> = {
    2: "2026-11-15",
    4: "2026-09-30",
    6: "2027-01-10",
    9: "2026-10-05",
    11: "2026-09-20",
    16: "2026-12-01",
    19: "2027-02-14",
};

export let ADMIN_PRODUCTS: AdminProduct[] = PRODUCTS.map((p) => ({
    id: p.id,
    name: p.title,
    sku: `LM-${String(p.id).padStart(4, "0")}`,
    category: p.category,
    price: p.price,
    stock: p.sizes?.length ? p.sizes.reduce((sum, s) => sum + s.stock, 0) : STOCK_BY_ID[p.id] ?? 20,
    expiry: EXPIRY_BY_ID[p.id] ?? null,
    image: p.image,
    sizes: p.sizes,
}));

// A new product added without a photo needs a real image, not an empty
// string — next/image throws if `src` is "". Fall back to a representative
// photo for its category, or the very first product's photo otherwise.
export const CATEGORY_DEFAULT_IMAGE: Record<string, AdminProduct["image"]> = PRODUCTS.reduce(
    (acc, p) => (acc[p.category] ? acc : { ...acc, [p.category]: p.image }),
    {} as Record<string, AdminProduct["image"]>
);

export const DEFAULT_PRODUCT_IMAGE: AdminProduct["image"] = PRODUCTS[0].image;

export function setAdminProducts(next: AdminProduct[]) {
    ADMIN_PRODUCTS = next;
}

// Default units-remaining cutoff for "low stock" — used whenever a product
// doesn't set its own `reorderThreshold`.
export const LOW_STOCK_THRESHOLD = 8;

export function stockStatus(stock: number, threshold: number = LOW_STOCK_THRESHOLD): "in" | "low" | "out" {
    if (stock <= 0) return "out";
    if (stock <= threshold) return "low";
    return "in";
}

// Effective stock for a product — the sum across its sizes when it has any,
// otherwise the flat `stock` field. Every stock-health/low-stock/sort
// consumer should read through this rather than `product.stock` directly,
// so a per-size stock edit is reflected everywhere it's counted.
export function productStock(product: AdminProduct): number {
    return product.sizes?.length ? product.sizes.reduce((sum, s) => sum + s.stock, 0) : product.stock;
}

// Stock status for a product, honoring its own reorder threshold. Sized
// products are judged by their worst size rather than the summed total, so a
// product with one dead variant and one healthy one still surfaces as "low"
// instead of hiding behind a comfortable-looking sum.
export function productStockStatus(product: AdminProduct): "in" | "low" | "out" {
    const threshold = product.reorderThreshold ?? LOW_STOCK_THRESHOLD;
    if (product.sizes?.length) {
        const statuses = product.sizes.map((s) => stockStatus(s.stock, threshold));
        if (statuses.every((s) => s === "out")) return "out";
        if (statuses.some((s) => s !== "in")) return "low";
        return "in";
    }
    return stockStatus(product.stock, threshold);
}

// Days remaining until a product's expiry date (negative once past it), or
// null when it doesn't track one.
export function daysUntilExpiry(expiry: string | null): number | null {
    if (!expiry) return null;
    // Parsed as local-timezone components, not `new Date(expiry)` — a bare
    // YYYY-MM-DD string parses as UTC midnight, which lands on the previous
    // local day west of Greenwich and makes items look expired a day early.
    const [year, month, day] = expiry.split("-").map(Number);
    const ms = new Date(year, month - 1, day).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
    return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Window (in days) within which an upcoming expiry counts as "soon" for
// dashboard alerts.
export const EXPIRY_WARNING_DAYS = 60;

export function isExpiringSoon(expiry: string | null): boolean {
    const days = daysUntilExpiry(expiry);
    return days !== null && days >= 0 && days <= EXPIRY_WARNING_DAYS;
}

// Price range across a product's sizes (both equal to `price` when there
// are none) — for display and for sorting by starting price.
export function productPriceRange(product: AdminProduct): { min: number; max: number } {
    if (!product.sizes?.length) return { min: product.price, max: product.price };
    const prices = product.sizes.map((s) => s.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
}
