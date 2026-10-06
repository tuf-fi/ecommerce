import type { AdminProduct } from "./admin/types";
import type { ProductSize } from "./products";
import { ApiError } from "./api/client";
import type { ProductPayload } from "./api/products";

export function errorMessage(err: unknown): string {
    return err instanceof ApiError ? err.message : "Could not reach the server. Please try again.";
}

// Sizes the server hasn't seen yet carry a client-generated id like "s1700…"; only numeric ids exist in the database.
export const isServerId = (id: string) => /^\d+$/.test(id);

export function sizesPayload(sizes: ProductSize[]): NonNullable<ProductPayload["sizes"]> {
    return sizes.map((s) => ({
        ...(isServerId(s.id) ? { id: Number(s.id) } : { stock: s.stock }),
        label: s.label,
        price: s.price,
    }));
}

// Base64 data URLs can't be stored yet (photo upload arrives with Cloudinary), so only real paths/URLs are sent.
export function persistableImage(image: AdminProduct["image"]): string | null {
    return typeof image === "string" && !image.startsWith("data:") ? image : null;
}

export function isUnsavedPhoto(image: AdminProduct["image"]): boolean {
    return typeof image === "string" && image.startsWith("data:");
}

export function toCreatePayload(input: Omit<AdminProduct, "id">): ProductPayload {
    const image = persistableImage(input.image);
    const sizes = input.sizes ?? [];
    return {
        name: input.name,
        sku: input.sku,
        category: input.category,
        expiry: input.expiry,
        reorderThreshold: input.reorderThreshold ?? null,
        ...(image ? { image } : {}),
        ...(sizes.length ? { sizes: sizesPayload(sizes) } : { price: input.price, stock: input.stock }),
    };
}
