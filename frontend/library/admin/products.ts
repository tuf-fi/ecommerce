import { AdminProduct } from "./types";

// Photo-less products fall back to a representative image for their category (next/image rejects an empty src).
export const CATEGORY_DEFAULT_IMAGE: Record<string, string> = {
    Serum: "/products/overnight-retinol-serum.jpg",
    Treatment: "/products/niacinamide-pore-refiner.jpg",
    Moisturizer: "/products/quiet-glow-gel-cream.jpg",
    Body: "/products/rice-milk-body-wash.jpg",
    Sets: "/products/the-ritual-edit-full-set.jpg",
};

export const DEFAULT_PRODUCT_IMAGE = "/products/overnight-retinol-serum.jpg";

// Default "low stock" cutoff when a product sets no own `reorderThreshold`.
export const LOW_STOCK_THRESHOLD = 8;

export function stockStatus(stock: number, threshold: number = LOW_STOCK_THRESHOLD): "in" | "low" | "out" {
    if (stock <= 0) return "out";
    if (stock <= threshold) return "low";
    return "in";
}

// Consumers should read stock through here, not `product.stock` directly, so a per-size edit is reflected everywhere.
export function productStock(product: AdminProduct): number {
    return product.sizes?.length ? product.sizes.reduce((sum, s) => sum + s.stock, 0) : product.stock;
}

// Sized products are judged by their worst size, not the summed total, so one dead variant still surfaces as "low".
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

// Negative once past the expiry date; null when the product doesn't track one.
export function daysUntilExpiry(expiry: string | null): number | null {
    if (!expiry) return null;
    // Parsed as local-timezone components, not `new Date(expiry)`, which reads a bare date as UTC and can land a day early.
    const [year, month, day] = expiry.split("-").map(Number);
    const ms = new Date(year, month - 1, day).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
    return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Days within which an upcoming expiry counts as "soon" for dashboard alerts.
export const EXPIRY_WARNING_DAYS = 60;

export function isExpiringSoon(expiry: string | null): boolean {
    const days = daysUntilExpiry(expiry);
    return days !== null && days >= 0 && days <= EXPIRY_WARNING_DAYS;
}

// The lowest discounted price across a product's sizes (or its own), or null when nothing is on sale.
export function productSalePrice(product: AdminProduct): number | null {
    if (!product.sizes?.length) return product.salePrice != null && product.salePrice < product.price ? product.salePrice : null;
    if (!product.sizes.some((s) => s.salePrice != null && s.salePrice < s.price)) return null;
    return Math.min(...product.sizes.map((s) => (s.salePrice != null && s.salePrice < s.price ? s.salePrice : s.price)));
}

// Price range across a product's sizes — both equal `price` when it has none.
export function productPriceRange(product: AdminProduct): { min: number; max: number } {
    if (!product.sizes?.length) return { min: product.price, max: product.price };
    const prices = product.sizes.map((s) => s.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
}
