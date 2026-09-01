"use client";

import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { ORDER_STATUSES } from "@/components/admin/orderStatus";
import { AdminOrder, AdminOrderStatus } from "@/library/admin/types";
import { getProduct } from "@/library/products";
import { orderTotal } from "@/library/admin/orders";

export default function OrderModal({
    open,
    order,
    onClose,
    onStatusChange,
}: {
    open: boolean;
    order: AdminOrder | null;
    onClose: () => void;
    onStatusChange: (orderNo: string, status: AdminOrderStatus) => void;
}) {
    if (!order) return null;

    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-[480px]">
            <div className="p-8">
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-ink/10 pb-6">
                    <div>
                        <h3 className="mb-1 text-xl font-medium text-ink">Order {order.no}</h3>
                        <p className="font-mono text-[11px] text-grey">{order.date}</p>
                    </div>
                    <select
                        value={order.status}
                        onChange={(e) => onStatusChange(order.no, e.target.value as AdminOrderStatus)}
                        className="rounded-none border border-ink/10 px-3.5 py-2 text-[12.5px] text-ink outline-none transition focus:border-navy/30"
                    >
                        {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <div className="mb-1.5 font-mono text-[10px] tracking-[.14em] text-grey uppercase">Customer</div>
                    <p className="text-[13px] leading-relaxed text-ink/85">
                        {order.customer}
                        <br />
                        {order.email}
                        <br />
                        {order.address}
                    </p>
                </div>

                <div>
                    <div className="mb-1.5 font-mono text-[10px] tracking-[.14em] text-grey uppercase">Items</div>
                    {order.items.map((line) => {
                        const product = getProduct(line.productId);
                        if (!product) return null;
                        return (
                            <div key={line.productId} className="flex items-center gap-3.5 border-b border-ink/10 py-3 last:border-b-0">
                                <div className="relative h-14 w-14 flex-none overflow-hidden border border-ink/10">
                                    <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[13.5px] text-ink">{product.title}</div>
                                    <div className="font-mono text-[10px] tracking-[.1em] text-grey uppercase">Qty {line.qty}</div>
                                </div>
                                <div className="flex-none font-mono text-[13px] text-ink">₱{(product.price * line.qty).toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-2 flex justify-between border-t border-ink/10 pt-4 text-[15px] font-semibold text-ink">
                    <span>Total</span>
                    <span>₱{orderTotal(order).toLocaleString()}</span>
                </div>
            </div>
        </Modal>
    );
}
