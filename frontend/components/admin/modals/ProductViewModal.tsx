"use client";

import Image from "next/image";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { ViewHeader, DetailRow, DetailBody } from "@/components/admin/modals/ViewModalLayout";
import { AdminProduct } from "@/library/admin/types";
import { productStock, productStockStatus, productPriceRange, isExpiringSoon } from "@/library/adminStore";

const STOCK_LABEL: Record<"in" | "low" | "out", string> = {
    in: "In stock",
    low: "Low stock",
    out: "Out of stock",
};
const STOCK_TONE: Record<"in" | "low" | "out", "success" | "warning" | "alert"> = {
    in: "success",
    low: "warning",
    out: "alert",
};

export default function ProductViewModal({
    open,
    product,
    onClose,
}: {
    open: boolean;
    product: AdminProduct | null;
    onClose: () => void;
}) {
    if (!product) return null;

    const status = productStockStatus(product);
    const { min, max } = productPriceRange(product);

    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-[420px]">
            <ViewHeader
                eyebrow="Product"
                title={product.name}
                meta={<StatusBadge label={STOCK_LABEL[status]} tone={STOCK_TONE[status]} />}
                thumbnail={
                    <div className="relative h-12 w-12 flex-none overflow-hidden border border-ink/10 bg-gradient-to-br from-blue-soft to-pink-soft">
                        <Image src={product.image} alt="" fill sizes="48px" unoptimized={typeof product.image === "string"} className="object-cover" />
                    </div>
                }
            />
            <DetailBody>
                <DetailRow label="SKU" value={<span className="font-mono">{product.sku}</span>} />
                <DetailRow label="Category" value={product.category} />
                <DetailRow
                    label="Price"
                    value={min === max ? `₱${min.toLocaleString()}` : `₱${min.toLocaleString()}–₱${max.toLocaleString()}`}
                />
                <DetailRow label="Stock" value={`${productStock(product)} units`} />
                <DetailRow
                    label="Expiry"
                    value={
                        <span className="inline-flex items-center gap-2">
                            {product.expiry ?? "—"}
                            {isExpiringSoon(product.expiry) && <StatusBadge label="Expiring soon" tone="warning" />}
                        </span>
                    }
                />
                {product.sizes && product.sizes.length > 0 && (
                    <DetailRow
                        label="Sizes"
                        value={
                            <div className="flex flex-wrap justify-end gap-1.5">
                                {product.sizes.map((s) => {
                                    const sizeStatus = productStockStatus({ ...product, stock: s.stock, sizes: undefined });
                                    return (
                                        <span
                                            key={s.id}
                                            className={`border px-2 py-1 font-mono text-[11px] ${
                                                sizeStatus === "out"
                                                    ? "border-alert/30 bg-alert/5 text-alert"
                                                    : sizeStatus === "low"
                                                      ? "border-pink/30 bg-pink-soft text-pink-dark"
                                                      : "border-ink/10 bg-white text-ink"
                                            }`}
                                        >
                                            {s.label} · {s.stock}
                                        </span>
                                    );
                                })}
                            </div>
                        }
                    />
                )}
            </DetailBody>
        </Modal>
    );
}
