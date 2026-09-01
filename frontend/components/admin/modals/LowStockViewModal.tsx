"use client";

import Link from "next/link";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { AdminProduct } from "@/library/admin/types";
import { stockStatus } from "@/library/adminStore";

export default function LowStockViewModal({
    open,
    product,
    onClose,
}: {
    open: boolean;
    product: AdminProduct | null;
    onClose: () => void;
}) {
    if (!product) return null;

    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-[380px]">
            <div className="p-8 text-center">
                <div className="relative mx-auto mb-4 h-16 w-16 overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                    <Image src={product.image} alt="" fill sizes="64px" unoptimized={typeof product.image === "string"} className="object-cover" />
                </div>
                <h3 className="mb-1.5 text-xl font-medium text-ink">{product.name}</h3>
                <div className="mb-5">
                    <StatusBadge
                        label={stockStatus(product.stock) === "out" ? "Out of stock" : `${product.stock} left`}
                        tone={stockStatus(product.stock) === "out" ? "alert" : "warning"}
                    />
                </div>
                <div className="mb-6 border border-ink/10 bg-off/60 p-4 text-left text-[13px] leading-relaxed text-ink/85">
                    <div className="mb-2.5">
                        <span className="font-mono text-[10px] tracking-[.14em] text-grey uppercase">SKU</span>
                        <div className="font-mono">{product.sku}</div>
                    </div>
                    <div className="mb-2.5">
                        <span className="font-mono text-[10px] tracking-[.14em] text-grey uppercase">Category</span>
                        <div>{product.category}</div>
                    </div>
                    <div>
                        <span className="font-mono text-[10px] tracking-[.14em] text-grey uppercase">Price</span>
                        <div>₱{product.price.toLocaleString()}</div>
                    </div>
                </div>
                <Link
                    href="/admin/inventory"
                    className="inline-block border border-ink/15 px-5 py-2.5 text-[12.5px] text-ink transition hover:bg-off"
                >
                    Go to Inventory
                </Link>
            </div>
        </Modal>
    );
}
