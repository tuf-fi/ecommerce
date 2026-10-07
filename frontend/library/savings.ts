import { currentPrice, getProduct } from "./products";
import type { CartLine } from "./store";

// What a bag line saves from a running sale: the regular price minus the discounted rate, times the quantity.
// Code discounts are separate (the server works those out); the cart and checkout "Saved" add the two together.
export function lineSaleSavings(line: CartLine): number {
    const p = getProduct(line.productId);
    if (!p) return 0;
    const size = line.sizeId ? p.sizes?.find((s) => s.id === line.sizeId) : undefined;
    const item = size ?? p;
    return Math.max(0, item.price - currentPrice(item)) * line.qty;
}
