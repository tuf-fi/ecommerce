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
    stock: STOCK_BY_ID[p.id] ?? 20,
    expiry: EXPIRY_BY_ID[p.id] ?? null,
    image: p.image,
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

export function stockStatus(stock: number): "in" | "low" | "out" {
    if (stock <= 0) return "out";
    if (stock <= 8) return "low";
    return "in";
}
