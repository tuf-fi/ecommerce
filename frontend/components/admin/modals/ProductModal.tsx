"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SectionLabel as FormSection } from "@/components/admin/modals/ViewModalLayout";
import { AdminProduct } from "@/library/admin/types";
import { CATEGORY_DEFAULT_IMAGE, DEFAULT_PRODUCT_IMAGE, LOW_STOCK_THRESHOLD } from "@/library/admin/products";
import { CATEGORIES, ProductSize } from "@/library/products";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { TrashIcon } from "@/components/admin/icons";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction } from "@/library/useAsyncAction";
import { validateAndReadImage } from "@/library/image-upload";
import { STOCK_REASON_LABEL, StockReason } from "@/library/api/products";

// Clamps to a non-negative integer — plain `Number(x) || 0` would let negatives through since they're truthy.
function nonNegativeNumber(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

const EDITABLE_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

type SizeRow = { id: string; label: string; price: string; salePrice: string; stock: string };

function newSizeRow(): SizeRow {
    return { id: `s${Date.now()}${Math.floor(Math.random() * 1000)}`, label: "", price: "", salePrice: "", stock: "" };
}

// Mounted only while open, so fields init fresh from `product` with no reset effect needed.
export default function ProductModal({
    product,
    products = [],
    onClose,
    onSave,
}: {
    product: AdminProduct | null;
    // Used only to catch a duplicate SKU before saving; optional so existing call sites don't break.
    products?: AdminProduct[];
    onClose: () => void;
    // Resolves to false when saving failed, which keeps the form open. `stockReason` accompanies any stock change on an existing product.
    onSave: (data: Omit<AdminProduct, "id">, id?: number, stockReason?: StockReason) => Promise<boolean>;
}) {
    const [name, setName] = useState(product?.name ?? "");
    const [category, setCategory] = useState<string>(product?.category ?? EDITABLE_CATEGORIES[0]);
    const [sku, setSku] = useState(product?.sku ?? "");
    const [price, setPrice] = useState(product ? String(product.price) : "");
    const [salePrice, setSalePrice] = useState(product?.salePrice != null && !product.sizes?.length ? String(product.salePrice) : "");
    const [stock, setStock] = useState(product ? String(product.stock) : "");
    const [reorderThreshold, setReorderThreshold] = useState(
        product?.reorderThreshold != null ? String(product.reorderThreshold) : ""
    );
    const [expiry, setExpiry] = useState(product?.expiry ?? "");
    const [photo, setPhoto] = useState<string | null>(null);
    const [sizes, setSizes] = useState<SizeRow[]>(
        () => product?.sizes?.map((s) => ({ id: s.id, label: s.label, price: String(s.price), salePrice: s.salePrice != null ? String(s.salePrice) : "", stock: String(s.stock) })) ?? []
    );
    const hasSizes = sizes.length > 0;

    // Net change in units versus what was loaded (existing products only); new size rows start at their entered stock instead.
    const stockDelta = product
        ? hasSizes
            ? sizes.reduce((sum, row) => {
                  const before = product.sizes?.find((o) => o.id === row.id);
                  return before ? sum + (nonNegativeNumber(row.stock) - before.stock) : sum;
              }, 0)
            : product.sizes?.length
              ? 0
              : nonNegativeNumber(stock) - product.stock
        : 0;
    const [chosenReason, setChosenReason] = useState<StockReason | null>(null);
    const stockReason: StockReason = chosenReason ?? (stockDelta > 0 ? "RESTOCK" : "CORRECTION");
    const [errors, setErrors] = useState<{ name?: string; sku?: string }>({});
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    const isDirty = useIsDirty({ name, category, sku, price, salePrice, stock, reorderThreshold, expiry, photo, sizes });

    function requestClose() {
        if (isDirty) setConfirmCloseOpen(true);
        else onClose();
    }

    function addSizeRow() {
        setSizes((rows) => [...rows, newSizeRow()]);
    }

    function updateSizeRow(index: number, field: "label" | "price" | "salePrice" | "stock", value: string) {
        setSizes((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    }

    function removeSizeRow(index: number) {
        setSizes((rows) => rows.filter((_, i) => i !== index));
    }

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const result = await validateAndReadImage(file, "products");
        if (!result.ok) {
            toast.error(result.reason);
            return;
        }
        setPhoto(result.url);
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const trimmedSku = sku.trim();
        const dupe = trimmedSku && products.some((p) => p.id !== product?.id && p.sku.toLowerCase() === trimmedSku.toLowerCase());
        const nextErrors: { name?: string; sku?: string } = {};
        if (!name.trim()) nextErrors.name = "Product name is required.";
        if (dupe) nextErrors.sku = `SKU "${trimmedSku}" is already used by another product.`;
        if (nextErrors.name || nextErrors.sku) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        const saleProblem = hasSizes
            ? sizes.some((s) => s.label.trim() && s.salePrice.trim() && nonNegativeNumber(s.salePrice) >= nonNegativeNumber(s.price))
            : salePrice.trim() !== "" && nonNegativeNumber(salePrice) >= nonNegativeNumber(price);
        if (saleProblem) {
            toast.error("A discounted price must be lower than the regular price.");
            return;
        }
        setErrors({});

        const parsedSizes: ProductSize[] = sizes
            .filter((s) => s.label.trim())
            .map((s) => ({ id: s.id, label: s.label.trim(), price: nonNegativeNumber(s.price),
                ...(s.salePrice.trim() ? { salePrice: nonNegativeNumber(s.salePrice) } : {}),
                stock: nonNegativeNumber(s.stock),
            }));

        const saved = await onSave(
            {
                name: name.trim(),
                sku: trimmedSku || `LM-${Math.floor(1000 + Math.random() * 9000)}`,
                category,
                price: parsedSizes.length ? Math.min(...parsedSizes.map((s) => s.price)) : nonNegativeNumber(price),
                salePrice: parsedSizes.length || !salePrice.trim() ? undefined : nonNegativeNumber(salePrice),
                stock: parsedSizes.length ? parsedSizes.reduce((sum, s) => sum + s.stock, 0) : nonNegativeNumber(stock),
                expiry: expiry || null,
                image: photo ?? product?.image ?? CATEGORY_DEFAULT_IMAGE[category] ?? DEFAULT_PRODUCT_IMAGE,
                sizes: parsedSizes.length ? parsedSizes : undefined,
                reorderThreshold: reorderThreshold.trim() ? nonNegativeNumber(reorderThreshold) : undefined,
            },
            product?.id,
            stockDelta !== 0 ? stockReason : undefined
        );
        if (saved) onClose();
    });

    const previewSrc = photo ?? (typeof product?.image === "string" ? product.image : product?.image);

    return (
        <>
        <Modal open onClose={submitting ? () => {} : requestClose} maxWidth="max-w-[520px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-5 sm:px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{product ? "Edit Product" : "Add Product"}</h3>
            </div>
            <div className="px-5 sm:px-8 pt-6 pb-4">
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
                    <input
                        id="product-name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                        }}
                        placeholder="e.g. Barrier Repair Cream"
                        aria-invalid={errors.name ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.name ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.name && <p className={FIELD_ERROR}>{errors.name}</p>}
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        <input
                            id="product-sku"
                            value={sku}
                            onChange={(e) => {
                                setSku(e.target.value);
                                if (errors.sku) setErrors((er) => ({ ...er, sku: undefined }));
                            }}
                            placeholder="LM-0000"
                            aria-invalid={errors.sku ? true : undefined}
                            className={`${FIELD_INPUT} ${errors.sku ? FIELD_INPUT_INVALID : ""}`}
                        />
                        {errors.sku && <p className={FIELD_ERROR}>{errors.sku}</p>}
                    </div>
                </div>

                <FormSection label="Pricing & Stock" />

                <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        <label htmlFor="product-sale-price" className={FIELD_LABEL}>Discounted Price (₱)</label>
                        <input
                            id="product-sale-price"
                            type="number"
                            min={0}
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                            placeholder="None"
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
                {hasSizes && <p className="mb-4 text-[11.5px] text-grey">Price, discounted price and stock are set per size below. Leave a discounted price empty for no discount.</p>}

                {stockDelta !== 0 && (
                    <div className="mb-4">
                        <label htmlFor="product-stock-reason" className={FIELD_LABEL}>
                            Reason for stock change ({stockDelta > 0 ? "+" : ""}{stockDelta})
                        </label>
                        <select
                            id="product-stock-reason"
                            value={stockReason}
                            onChange={(e) => setChosenReason(e.target.value as StockReason)}
                            className={FIELD_INPUT}
                        >
                            {(Object.keys(STOCK_REASON_LABEL) as StockReason[]).map((r) => (
                                <option key={r} value={r}>{STOCK_REASON_LABEL[r]}</option>
                            ))}
                        </select>
                    </div>
                )}

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
                                <div key={s.id} className="grid grid-cols-[1fr_76px_76px_64px_auto] items-center gap-2">
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
                                        value={s.salePrice}
                                        onChange={(e) => updateSizeRow(i, "salePrice", e.target.value)}
                                        placeholder="Sale"
                                        aria-label={`Size ${i + 1} discounted price`}
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
                                        className={`flex-none ${ICON_BTN_DANGER}`}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <FormSection label="Availability" />

                <div>
                    <label htmlFor="product-expiry" className={FIELD_LABEL}>Expiry Date (optional)</label>
                    <input id="product-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={FIELD_INPUT} />
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-5 sm:px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Product"}
                </button>
            </div>
        </Modal>
        <ConfirmModal
            open={confirmCloseOpen}
            title="Discard changes?"
            description="Your edits to this product haven't been saved."
            confirmLabel="Discard"
            onConfirm={onClose}
            onClose={() => setConfirmCloseOpen(false)}
        />
        </>
    );
}
