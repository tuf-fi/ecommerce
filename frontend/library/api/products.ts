import { api } from "./client";
import type { Product } from "../products";
import type { AdminProduct, StockLogEntry } from "../admin/types";
import type { PlaceholderVariant } from "@/components/ui/Placeholder";
import { CATEGORY_DEFAULT_IMAGE, DEFAULT_PRODUCT_IMAGE } from "../admin/products";

import { MOCK_API } from "../mock/config";
import { PRODUCTS as MOCK_PRODUCTS } from "../mock/data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type StockReason = "RESTOCK" | "CORRECTION" | "DAMAGED" | "EXPIRED" | "RETURN";

export const STOCK_REASON_LABEL: Record<StockReason, string> = {
    RESTOCK: "Restock",
    CORRECTION: "Correction",
    DAMAGED: "Damaged",
    EXPIRED: "Expired",
    RETURN: "Return",
};

type ApiSize = { id: number; label: string; price: number; salePrice?: number | null; stock: number; reorderThreshold?: number | null };

export type ApiProduct = {
    id: number;
    sku: string;
    name: string;
    category: string;
    description: string;
    price: number;
    salePrice?: number | null;
    stock: number;
    rating: number;
    ratingCount: number;
    image: string | null;
    concerns: string[];
    sizes: ApiSize[];
    // Staff-only fields.
    expiry?: string | null;
    reorderThreshold?: number | null;
    version?: number;
};

export type ApiStockMovement = {
    id: number;
    productId: number;
    productName: string;
    sizeLabel: string | null;
    quantity: number;
    reason: "RESTOCK" | "CORRECTION" | "DAMAGED" | "EXPIRED" | "RETURN" | "SALE" | "IMPORT";
    note: string | null;
    actor: string;
    createdAt: string;
};

const VARIANTS: PlaceholderVariant[] = ["pink", "pastel", "blue", "ink"];

function imageFor(p: ApiProduct): string {
    return p.image ?? CATEGORY_DEFAULT_IMAGE[p.category] ?? DEFAULT_PRODUCT_IMAGE;
}

export function toProduct(p: ApiProduct): Product {
    return {
        id: p.id,
        category: p.category,
        title: p.name,
        price: p.price,
        salePrice: p.salePrice ?? undefined,
        stock: p.stock,
        rating: p.rating,
        count: p.ratingCount,
        desc: p.description,
        image: imageFor(p),
        variant: VARIANTS[p.id % VARIANTS.length],
        sizes: p.sizes.length ? p.sizes.map((s) => ({ id: String(s.id), label: s.label, price: s.price, salePrice: s.salePrice ?? undefined, stock: s.stock })) : undefined,
        concerns: p.concerns.length ? p.concerns : undefined,
    };
}

export function toAdminProduct(p: ApiProduct): AdminProduct {
    return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        salePrice: p.salePrice ?? undefined,
        stock: p.stock,
        expiry: p.expiry ?? null,
        image: imageFor(p),
        sizes: p.sizes.length ? p.sizes.map((s) => ({ id: String(s.id), label: s.label, price: s.price, salePrice: s.salePrice ?? undefined, stock: s.stock })) : undefined,
        reorderThreshold: p.reorderThreshold ?? undefined,
        version: p.version,
    };
}

// Also runs on the server (root layout, sitemap, metadata). Fails soft to an empty catalogue so a down API
// degrades the shop instead of breaking every page.
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

// The API caps list responses, so a long catalogue arrives in pages; this walks them all.
async function allPages(getPage: (page: number) => Promise<{ products: ApiProduct[]; total: number }>): Promise<ApiProduct[]> {
    const all: ApiProduct[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        const { products, total } = await getPage(page);
        all.push(...products);
        if (products.length === 0 || all.length >= total) break;
    }
    return all;
}

export async function fetchCatalog(): Promise<Product[]> {
    if (MOCK_API) return MOCK_PRODUCTS.map(toProduct);
    try {
        const products = await allPages(async (page) => {
            const res = await fetch(`${API_URL}/products?page=${page}&pageSize=${PAGE_SIZE}`, { next: { revalidate: 30 } });
            if (!res.ok) throw new Error(`catalogue request failed: ${res.status}`);
            return res.json();
        });
        return products.map(toProduct);
    } catch {
        return [];
    }
}

export async function fetchCatalogClient(): Promise<Product[]> {
    const products = await allPages((page) => api(`/products?page=${page}&pageSize=${PAGE_SIZE}`));
    return products.map(toProduct);
}

export async function listAdminProducts(): Promise<{ products: ApiProduct[] }> {
    return { products: await allPages((page) => api(`/products/admin?page=${page}&pageSize=${PAGE_SIZE}`)) };
}

export type ProductPayload = {
    name?: string;
    sku?: string;
    category?: string;
    price?: number;
    salePrice?: number | null;
    stock?: number;
    expiry?: string | null;
    image?: string | null;
    reorderThreshold?: number | null;
    // Required when editing an existing product.
    version?: number;
    sizes?: { id?: number; label: string; price: number; salePrice?: number | null; stock?: number; reorderThreshold?: number | null }[];
};

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const createProduct = (payload: ProductPayload) => api<{ product: ApiProduct }>("/products", send("POST", payload));
export const updateProductDetails = (id: number, payload: ProductPayload) => api<{ product: ApiProduct }>(`/products/${id}`, send("PATCH", payload));
export const deleteProductById = (id: number) => api<{ ok: true }>(`/products/${id}`, send("DELETE"));

export const adjustStock = (id: number, input: { sizeId?: number; delta: number; reason: StockReason; note?: string }) =>
    api<{ product: ApiProduct }>(`/products/${id}/stock-adjustment`, send("POST", input));

export async function listStockLog(pageSize = 100) {
    const { items } = await api<{ items: ApiStockMovement[] }>(`/products/stock-log?pageSize=${pageSize}`);
    return items.map(toStockLogEntry);
}

const IN_REASONS = new Set(["RESTOCK", "RETURN", "IMPORT"]);

function toStockLogEntry(m: ApiStockMovement): StockLogEntry {
    const type: StockLogEntry["type"] = m.reason === "CORRECTION" ? "adj" : IN_REASONS.has(m.reason) ? "in" : "out";
    const what = m.sizeLabel ? `${m.productName} (${m.sizeLabel})` : m.productName;
    const sign = m.quantity > 0 ? "+" : "";
    const reason = m.reason.charAt(0) + m.reason.slice(1).toLowerCase();
    return {
        id: m.id,
        type,
        text: `${what} — ${reason}${m.note ? `: ${m.note}` : ""} (${sign}${m.quantity} unit${Math.abs(m.quantity) === 1 ? "" : "s"})`,
        time: new Date(m.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
        actor: m.actor,
    };
}
