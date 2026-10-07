import { StaticImageData } from "next/image";
import { PlaceholderVariant } from "@/components/ui/Placeholder";

export type ProductSize = {
    id: string;
    label: string;
    price: number;
    // Discounted rate set by an admin; only meaningful when below `price`.
    salePrice?: number;
    stock: number;
};

export type Product = {
    id: number;
    category: string;
    title: string;
    price: number;
    // Lowest discounted rate across the product (or its sizes), when any is on sale.
    salePrice?: number;
    // Units on hand: the total across sizes for a sized product.
    stock: number;
    rating: number;
    count: number;
    desc: string;
    image: StaticImageData | string;
    variant: PlaceholderVariant;
    // Optional size choices; when present, `price` above is the starting-from (cheapest) price.
    sizes?: ProductSize[];
    // Concern keys (see Concern.key in admin/types.ts) this product addresses — drives the Shop by Concern filter.
    concerns?: string[];
};

// What a customer pays: the discounted rate when one is set and actually lower than the regular price.
export function currentPrice(item: { price: number; salePrice?: number | null }): number {
    return item.salePrice != null && item.salePrice < item.price ? item.salePrice : item.price;
}

export function isOnSale(item: { price: number; salePrice?: number | null }): boolean {
    return currentPrice(item) < item.price;
}

export const CATEGORIES = ["All", "Serum", "Treatment", "Moisturizer", "Body", "Sets"] as const;

// The live catalogue, filled by ProductsProvider (library/productsStore.tsx) from the API. A live binding, so
// every importer sees updates; components re-render via the catalogue version that useStore()/useAdminStore() expose.
export let PRODUCTS: Product[] = [];

export function setCatalog(next: Product[]) {
    PRODUCTS = next;
}

export function getProduct(id: number): Product | undefined {
    return PRODUCTS.find((p) => p.id === id);
}

// The cheapest size, used to default a "quick add" regardless of entry order.
export function cheapestSizeId(product: Product): string | null {
    if (!product.sizes || product.sizes.length === 0) return null;
    return product.sizes.reduce((min, s) => (currentPrice(s) < currentPrice(min) ? s : min)).id;
}
