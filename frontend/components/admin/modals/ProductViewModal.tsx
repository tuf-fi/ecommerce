"use client";

import Image from "next/image";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { ViewHeader, DetailRow, DetailBody, FactRow, FactCell, SectionLabel, SizeTable } from "@/components/admin/modals/ViewModalLayout";
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
                title={product.name}
                caption={
                    <span className="inline-flex items-center gap-1.5">
                        <span className="font-mono">{product.sku}</span>
                        <span className="text-ink/25">·</span>
                        <span>{product.category}</span>
                    </span>
                }
                badge={<StatusBadge label={STOCK_LABEL[status]} tone={STOCK_TONE[status]} />}
                thumbnail={
                    <div className="relative h-12 w-12 flex-none overflow-hidden border border-ink/10 bg-gradient-to-br from-blue-soft to-pink-soft">
                        <Image src={product.image} alt="" fill sizes="48px" unoptimized={typeof product.image === "string"} className="object-cover" />
                    </div>
                }
            />
            <FactRow>
                <FactCell label="Price" size="lg" value={min === max ? `₱${min.toLocaleString()}` : `₱${min.toLocaleString()}–₱${max.toLocaleString()}`} />
                <FactCell label="Stock" size="lg" tone={status === "out" ? "alert" : status === "low" ? "warning" : "default"} value={`${productStock(product)} units`} />
            </FactRow>
            <DetailBody>
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
                    <div className="mt-5">
                        <SectionLabel label="Sizes" />
                        <SizeTable
                            sizes={product.sizes.map((s) => {
                                const sizeStatus = productStockStatus({ ...product, stock: s.stock, sizes: undefined });
                                return {
                                    id: s.id,
                                    label: s.label,
                                    price: s.price,
                                    stock: s.stock,
                                    tone: sizeStatus === "out" ? "alert" : sizeStatus === "low" ? "warning" : "default",
                                };
                            })}
                        />
                    </div>
                )}
            </DetailBody>
        </Modal>
    );
}
