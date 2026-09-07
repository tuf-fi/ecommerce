"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { AdminProduct } from "@/library/admin/types";
import { CATEGORY_DEFAULT_IMAGE, DEFAULT_PRODUCT_IMAGE, LOW_STOCK_THRESHOLD } from "@/library/admin/products";
import { CATEGORIES, ProductSize } from "@/library/products";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Clamps to a non-negative integer — plain `Number(x) || 0` lets negatives
// (e.g. "-5") through unchanged since they're truthy.
function nonNegativeNumber(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

const EDITABLE_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

type SizeRow = { id: string; label: string; price: string; stock: string };

function newSizeRow(): SizeRow {
    return { id: `s${Date.now()}${Math.floor(Math.random() * 1000)}`, label: "", price: "", stock: "" };
}

// Mounted only while the modal is open (see InventoryPage), so every field
// initializes fresh from `product` with no effect needed to "reset" it.
export default function ProductModal({
    product,
    products = [],
    onClose,
    onSave,
}: {
    product: AdminProduct | null;
    // Other products in the catalogue, used only to catch a duplicate SKU
    // before it's saved. Optional so existing call sites don't break.
    products?: AdminProduct[];
    onClose: () => void;
    onSave: (data: Omit<AdminProduct, "id">, id?: number) => void;
}) {
    const [name, setName] = useState(product?.name ?? "");
    const [category, setCategory] = useState<string>(product?.category ?? EDITABLE_CATEGORIES[0]);
    const [sku, setSku] = useState(product?.sku ?? "");
    const [price, setPrice] = useState(product ? String(product.price) : "");
    const [stock, setStock] = useState(product ? String(product.stock) : "");
    const [reorderThreshold, setReorderThreshold] = useState(
        product?.reorderThreshold != null ? String(product.reorderThreshold) : ""
    );
    const [expiry, setExpiry] = useState(product?.expiry ?? "");
    const [photo, setPhoto] = useState<string | null>(null);
    const [sizes, setSizes] = useState<SizeRow[]>(
        () => product?.sizes?.map((s) => ({ id: s.id, label: s.label, price: String(s.price), stock: String(s.stock) })) ?? []
    );
    const hasSizes = sizes.length > 0;

    function addSizeRow() {
        setSizes((rows) => [...rows, newSizeRow()]);
    }

    function updateSizeRow(index: number, field: "label" | "price" | "stock", value: string) {
        setSizes((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    }

    function removeSizeRow(index: number) {
        setSizes((rows) => rows.filter((_, i) => i !== index));
    }

    // TODO: upload to Cloudinary and store the returned URL once the backend
    // exists — this reads the file straight into a base64 data URL, which is
    // fine for an in-memory demo but not something to persist for real.
    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPhoto(reader.result as string);
        reader.readAsDataURL(file);
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        if (!name.trim()) {
            toast.error("Product name is required.");
            return;
        }
        const trimmedSku = sku.trim();
        const dupe = trimmedSku && products.some((p) => p.id !== product?.id && p.sku.toLowerCase() === trimmedSku.toLowerCase());
        if (dupe) {
            toast.error(`SKU "${trimmedSku}" is already used by another product.`);
            return;
        }
        await wait();

        const parsedSizes: ProductSize[] = sizes
            .filter((s) => s.label.trim())
            .map((s) => ({ id: s.id, label: s.label.trim(), price: nonNegativeNumber(s.price), stock: nonNegativeNumber(s.stock) }));

        onSave(
            {
                name: name.trim(),
                sku: trimmedSku || `LM-${Math.floor(1000 + Math.random() * 9000)}`,
                category,
                price: parsedSizes.length ? Math.min(...parsedSizes.map((s) => s.price)) : nonNegativeNumber(price),
                stock: parsedSizes.length ? parsedSizes.reduce((sum, s) => sum + s.stock, 0) : nonNegativeNumber(stock),
                expiry: expiry || null,
                image: photo ?? product?.image ?? CATEGORY_DEFAULT_IMAGE[category] ?? DEFAULT_PRODUCT_IMAGE,
                sizes: parsedSizes.length ? parsedSizes : undefined,
                reorderThreshold: reorderThreshold.trim() ? nonNegativeNumber(reorderThreshold) : undefined,
            },
            product?.id
        );
        onClose();
    });

    const previewSrc = photo ?? (typeof product?.image === "string" ? product.image : product?.image);

    return (
        <Modal open onClose={submitting ? () => {} : onClose} maxWidth="max-w-[520px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{product ? "Edit Product" : "Add Product"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <div className="mb-5 flex items-center gap-4">
                    <label className="relative h-16 w-16 flex-none cursor-pointer overflow-hidden border border-ink/10 bg-gradient-to-br from-blue-soft to-pink-soft">
                        {previewSrc ? (
                            <Image src={previewSrc} alt="" fill sizes="64px" unoptimized={typeof previewSrc === "string"} className="object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-ink/60">
                                {name.charAt(0).toUpperCase() || "+"}
                            </span>
                        )}
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" aria-label="Upload product photo" />
                    </label>
                    <div>
                        <div className="text-[13.5px] font-medium text-ink">{name || "New product"}</div>
                        <label className="mt-1 block cursor-pointer text-[12px] text-pink-dark underline decoration-1 underline-offset-2 hover:text-pink-dark/80">
                            Change photo
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" aria-label="Change product photo" />
                        </label>
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="product-name" className={FIELD_LABEL}>Product Name</label>
                    <input id="product-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Barrier Repair Cream" className={FIELD_INPUT} />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="product-category" className={FIELD_LABEL}>Category</label>
                        <select id="product-category" value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD_INPUT}>
                            {EDITABLE_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="product-sku" className={FIELD_LABEL}>SKU</label>
                        <input id="product-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="LM-0000" className={FIELD_INPUT} />
                    </div>
                </div>

                <div className="mb-2 grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="product-price" className={FIELD_LABEL}>Price (₱)</label>
                        <input
                            id="product-price"
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0"
                            disabled={hasSizes}
                            className={`${FIELD_INPUT} disabled:cursor-not-allowed disabled:opacity-50`}
                        />
                    </div>
                    <div>
                        <label htmlFor="product-stock" className={FIELD_LABEL}>Stock</label>
                        <input
                            id="product-stock"
                            type="number"
                            min={0}
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            placeholder="0"
                            disabled={hasSizes}
                            className={`${FIELD_INPUT} disabled:cursor-not-allowed disabled:opacity-50`}
                        />
                    </div>
                </div>
                {hasSizes && <p className="mb-4 text-[11.5px] text-grey">Price and stock are set per size below.</p>}

                <div className="mb-6">
                    <label htmlFor="product-reorder-threshold" className={FIELD_LABEL}>Low Stock Alert Below</label>
                    <input
                        id="product-reorder-threshold"
                        type="number"
                        min={0}
                        value={reorderThreshold}
                        onChange={(e) => setReorderThreshold(e.target.value)}
                        placeholder={String(LOW_STOCK_THRESHOLD)}
                        className={FIELD_INPUT}
                    />
                </div>

                <div className={hasSizes ? "mb-4" : "mb-6"}>
                    <div className="mb-2 flex items-center justify-between">
                        <span className={FIELD_LABEL}>Sizes (optional)</span>
                        <button type="button" onClick={addSizeRow} className="text-[11.5px] text-pink-dark underline decoration-1 underline-offset-2 hover:text-pink-dark/80">
                            + Add Size
                        </button>
                    </div>
                    {sizes.length === 0 ? (
                        <p className="text-[11.5px] text-grey">No size options — this product sells as a single item using the price/stock above.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {sizes.map((s, i) => (
                                <div key={s.id} className="grid grid-cols-[1fr_84px_72px_auto] items-center gap-2">
                                    <input
                                        value={s.label}
                                        onChange={(e) => updateSizeRow(i, "label", e.target.value)}
                                        placeholder="e.g. 30ml"
                                        aria-label={`Size ${i + 1} label`}
                                        className={FIELD_INPUT}
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        value={s.price}
                                        onChange={(e) => updateSizeRow(i, "price", e.target.value)}
                                        placeholder="Price"
                                        aria-label={`Size ${i + 1} price`}
                                        className={FIELD_INPUT}
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        value={s.stock}
                                        onChange={(e) => updateSizeRow(i, "stock", e.target.value)}
                                        placeholder="Stock"
                                        aria-label={`Size ${i + 1} stock`}
                                        className={FIELD_INPUT}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSizeRow(i)}
                                        aria-label="Remove size"
                                        className="flex h-9 w-9 flex-none items-center justify-center text-lg text-grey transition hover:text-alert"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="product-expiry" className={FIELD_LABEL}>Expiry Date (optional)</label>
                    <input id="product-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={FIELD_INPUT} />
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Product"}
                </button>
            </div>
        </Modal>
    );
}
