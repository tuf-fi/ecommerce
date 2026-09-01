"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { AdminProduct } from "@/library/admin/types";
import { CATEGORY_DEFAULT_IMAGE, DEFAULT_PRODUCT_IMAGE } from "@/library/admin/products";
import { CATEGORIES } from "@/library/products";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";

const EDITABLE_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

// Mounted only while the modal is open (see InventoryPage), so every field
// initializes fresh from `product` with no effect needed to "reset" it.
export default function ProductModal({
    product,
    onClose,
    onSave,
}: {
    product: AdminProduct | null;
    onClose: () => void;
    onSave: (data: Omit<AdminProduct, "id">, id?: number) => void;
}) {
    const [name, setName] = useState(product?.name ?? "");
    const [category, setCategory] = useState<string>(product?.category ?? EDITABLE_CATEGORIES[0]);
    const [sku, setSku] = useState(product?.sku ?? "");
    const [price, setPrice] = useState(product ? String(product.price) : "");
    const [stock, setStock] = useState(product ? String(product.stock) : "");
    const [expiry, setExpiry] = useState(product?.expiry ?? "");
    const [photo, setPhoto] = useState<string | null>(null);

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPhoto(reader.result as string);
        reader.readAsDataURL(file);
    }

    function handleSubmit() {
        if (!name.trim()) return;
        onSave(
            {
                name: name.trim(),
                sku: sku.trim() || `LM-${Math.floor(1000 + Math.random() * 9000)}`,
                category,
                price: Number(price) || 0,
                stock: Number(stock) || 0,
                expiry: expiry || null,
                image: photo ?? product?.image ?? CATEGORY_DEFAULT_IMAGE[category] ?? DEFAULT_PRODUCT_IMAGE,
            },
            product?.id
        );
        onClose();
    }

    const previewSrc = photo ?? (typeof product?.image === "string" ? product.image : product?.image);

    return (
        <Modal open onClose={onClose} maxWidth="max-w-[460px]">
            <div className="p-8">
                <h3 className="mb-5 text-xl font-medium text-ink">{product ? "Edit Product" : "Add Product"}</h3>

                <div className="mb-5 flex items-center gap-4">
                    <label className="relative h-16 w-16 flex-none cursor-pointer overflow-hidden border border-ink/10 bg-gradient-to-br from-blue-soft to-pink-soft">
                        {previewSrc ? (
                            <Image src={previewSrc} alt="" fill sizes="64px" unoptimized={typeof previewSrc === "string"} className="object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-ink/60">
                                {name.charAt(0).toUpperCase() || "+"}
                            </span>
                        )}
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                    <div>
                        <div className="text-[13.5px] font-medium text-ink">{name || "New product"}</div>
                        <label className="mt-1 block cursor-pointer text-[12px] text-pink-dark underline decoration-1 underline-offset-2 hover:text-pink-dark/80">
                            Change photo
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Product Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Barrier Repair Cream" className={FIELD_INPUT} />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                        <label className={FIELD_LABEL}>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD_INPUT}>
                            {EDITABLE_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={FIELD_LABEL}>SKU</label>
                        <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="LM-0000" className={FIELD_INPUT} />
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                        <label className={FIELD_LABEL}>Price (₱)</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className={FIELD_INPUT} />
                    </div>
                    <div>
                        <label className={FIELD_LABEL}>Stock</label>
                        <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className={FIELD_INPUT} />
                    </div>
                </div>

                <div className="mb-6">
                    <label className={FIELD_LABEL}>Expiry Date (optional)</label>
                    <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={FIELD_INPUT} />
                </div>

                <button onClick={handleSubmit} className={`w-full ${BTN_PRIMARY}`}>
                    Save Product
                </button>
            </div>
        </Modal>
    );
}
