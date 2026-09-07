"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ORDER_STATUSES } from "@/components/admin/orderStatus";
import { DetailRow, DetailBody } from "@/components/admin/modals/ViewModalLayout";
import { AdminOrder, AdminOrderStatus } from "@/library/admin/types";
import { getProduct } from "@/library/products";
import { orderTotal } from "@/library/admin/orders";

const CANCELLED_STATUS: AdminOrderStatus = "Cancelled";

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
    // Gates the one irreversible, customer-visible transition (-> Cancelled)
    // behind ConfirmModal, per CLAUDE.md's destructive-action rule. This
    // component stays mounted across order switches (OrdersPage always
    // renders it), so any leftover pending confirmation needs clearing
    // whenever the order it applies to changes — done as a render-time state
    // adjustment (see StaffPage/OrdersPage for the same pattern) rather than
    // an effect, since it only needs to run during the render that changed
    // `order`, not as a separate post-commit step.
    const [pendingCancel, setPendingCancel] = useState(false);
    const [prevOrderNo, setPrevOrderNo] = useState(order?.no);
    if (order?.no !== prevOrderNo) {
        setPrevOrderNo(order?.no);
        setPendingCancel(false);
    }

    if (!order) return null;

    function handleStatusChange(next: AdminOrderStatus) {
        if (!order) return;
        if (next === CANCELLED_STATUS && order.status !== CANCELLED_STATUS) {
            // Don't call the mutation yet — the <select> stays bound to
            // order.status, so this re-render snaps its displayed value back
            // instead of visually committing to Cancelled before it's confirmed.
            setPendingCancel(true);
            return;
        }
        onStatusChange(order.no, next);
    }

    return (
        <>
            <Modal open={open} onClose={onClose} maxWidth="max-w-[480px]">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-white px-8 py-5">
                    <div className="min-w-0">
                        <span className="block font-mono text-[10px] uppercase tracking-[.14em] text-grey">Order</span>
                        <h3 className="mt-0.5 text-lg font-medium text-ink">{order.no}</h3>
                        <p className="mt-1 font-mono text-[11px] text-grey">{order.date}</p>
                    </div>
                    <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(e.target.value as AdminOrderStatus)}
                        className="rounded-none border border-ink/10 px-3.5 py-2 text-[12.5px] text-ink outline-none transition focus:border-navy/30"
                    >
                        {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <DetailBody>
                    <DetailRow label="Customer" value={order.customer} />
                    <DetailRow label="Email" value={order.email} />
                    <DetailRow label="Address" value={order.address} />
                </DetailBody>

                <div className="border-t border-ink/10 px-8 py-6">
                    <span className="mb-3 block font-mono text-[10px] tracking-[.14em] text-grey uppercase">Items</span>
                    <div className="flex flex-col gap-3">
                        {order.items.map((line) => {
                            const product = getProduct(line.productId);
                            if (!product) return null;
                            return (
                                <div key={line.productId} className="flex items-center gap-3">
                                    <div className="relative h-11 w-11 flex-none overflow-hidden border border-ink/10">
                                        <Image src={product.image} alt="" fill sizes="44px" className="object-cover" />
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
                </div>

                <div className="sticky bottom-0 flex justify-between border-t border-ink/10 bg-white px-8 py-5 text-[15px] font-semibold text-ink">
                    <span>Total</span>
                    <span>₱{orderTotal(order).toLocaleString()}</span>
                </div>
            </Modal>

            <ConfirmModal
                open={pendingCancel}
                title="Cancel this order?"
                description={`Order ${order.no} will be marked Cancelled — this is visible to ${order.customer} and can't be undone from here.`}
                confirmLabel="Cancel Order"
                loadingLabel="Cancelling…"
                cancelLabel="Keep Order"
                onConfirm={() => onStatusChange(order.no, CANCELLED_STATUS)}
                onClose={() => setPendingCancel(false)}
            />
        </>
    );
}
