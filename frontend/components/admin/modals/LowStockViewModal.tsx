"use client";

import Link from "next/link";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { ViewHeader, DetailBody, DetailList, SectionLabel, SizeTable } from "@/components/admin/modals/ViewModalLayout";
import { AdminProduct } from "@/library/admin/types";
import { productStock, productStockStatus, productPriceRange, useAdminStore } from "@/library/adminStore";
import { canAccessSection } from "@/library/admin/permissions";

export default function LowStockViewModal({
    open,
    product,
    onClose,
}: {
    open: boolean;
    product: AdminProduct | null;
    onClose: () => void;
}) {
    const { currentStaffMember } = useAdminStore();
    const canInventory = canAccessSection(currentStaffMember, "inventory");
    if (!product) return null;

    const { min, max } = productPriceRange(product);
    const status = productStockStatus(product);

    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-[380px]">
            <ViewHeader
                title={product.name}
                caption={
                    <span className="inline-flex items-center gap-1.5">
                        <span className="font-mono">{product.sku}</span>
                        <span className="text-ink/25">·</span>
                        <span>{product.category}</span>
                    </span>
                }
                badge={
                    <StatusBadge
                        label={status === "out" ? "Out of stock" : `${productStock(product)} left`}
                        tone={status === "out" ? "alert" : "warning"}
                    />
                }
                thumbnail={
                    <div className="relative h-12 w-12 flex-none overflow-hidden border border-ink/10 bg-gradient-to-br from-blue-soft to-pink-soft">
                        <Image src={product.image} alt="" fill sizes="48px" unoptimized={typeof product.image === "string"} className="object-cover" />
                    </div>
                }
            />
            <DetailList
                items={[
                    { label: "Stock left", value: `${productStock(product)} units`, tone: status === "out" ? "alert" : "warning" },
                    { label: "Price", value: min === max ? `₱${min.toLocaleString()}` : `₱${min.toLocaleString()}–₱${max.toLocaleString()}` },
                ]}
            />
            {product.sizes && product.sizes.length > 0 && (
                <DetailBody>
                    <SectionLabel label="Sizes" />
                    <SizeTable
                        sizes={product.sizes.map((s) => {
                            const sizeStatus = productStockStatus({ ...product, stock: s.stock, sizes: undefined });
                            return {
                                id: s.id,
                                label: s.label,
                                price: s.price,
                                salePrice: s.salePrice,
                                stock: s.stock,
                                tone: sizeStatus === "out" ? "alert" : sizeStatus === "low" ? "warning" : "default",
                            };
                        })}
                    />
                </DetailBody>
            )}
            {canInventory && (
                <div className="sticky bottom-0 border-t border-ink/10 bg-white px-5 sm:px-8 py-5">
                    <Link
                        href="/admin/inventory"
                        className="flex w-full items-center justify-center gap-2 border border-ink/15 py-3 text-center text-[12.5px] font-semibold uppercase tracking-wide text-ink transition hover:bg-off/60"
                    >
                        Go to Inventory
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                    </Link>
                </div>
            )}
        </Modal>
    );
}
