"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ORDER_STATUSES } from "@/components/admin/orderStatus";
import { AdminOrder, AdminOrderStatus } from "@/library/admin/types";
import { getProduct, currentPrice } from "@/library/products";
import { orderTotal } from "@/library/admin/orders";
import { listOrderHistory, OrderHistoryEntry } from "@/library/api/orders";
import ProofImage from "@/components/ui/ProofImage";
import { PAYMENT_METHOD_LABEL, PaymentMethodId } from "@/library/api/payments";
import { BTN_PRIMARY, FIELD_INPUT } from "@/components/admin/formClasses";
import { useAdminStore } from "@/library/adminStore";
import { isAdministrator } from "@/library/admin/permissions";

const CANCELLED_STATUS: AdminOrderStatus = "Cancelled";

const statusLabel = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function OrderModal({
    open,
    order,
    onClose,
    onStatusChange,
    onReviewPayment,
}: {
    open: boolean;
    order: AdminOrder | null;
    onClose: () => void;
    onStatusChange: (orderNo: string, status: AdminOrderStatus) => void;
    onReviewPayment: (orderNo: string, proofId: number, input: { decision: "approve" } | { decision: "reject"; reason: string }) => Promise<boolean>;
}) {
    const { currentStaffMember, refundOrder, reopenOrder } = useAdminStore();
    const [reopening, setReopening] = useState(false);
    const [refundOpen, setRefundOpen] = useState(false);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundNote, setRefundNote] = useState("");
    const [refunding, setRefunding] = useState(false);
    // The refund just recorded, shown straight away in case the parent hasn't reloaded this order yet.
    const [justRefunded, setJustRefunded] = useState<{ no: string; amount: number } | null>(null);

    // Stays mounted across order switches, so pending confirmation is cleared via render-time state adjustment when `order` changes.
    const [pendingCancel, setPendingCancel] = useState(false);
    const [prevOrderNo, setPrevOrderNo] = useState(order?.no);
    if (order?.no !== prevOrderNo) {
        setPrevOrderNo(order?.no);
        setPendingCancel(false);
        setRefundOpen(false);
        setRefundAmount("");
        setRefundNote("");
    }

    const [rejecting, setRejecting] = useState<number | null>(null);
    const [reason, setReason] = useState("");
    const [reviewing, setReviewing] = useState(false);

    // Keyed by order number so a previous order's history is never shown while the next one loads.
    const [history, setHistory] = useState<{ no: string; entries: OrderHistoryEntry[] } | null>(null);
    const orderNo = order?.no;
    const orderStatus = order?.status;
    useEffect(() => {
        if (!open || !orderNo) return;
        let stale = false;
        listOrderHistory(orderNo)
            .then(({ history: entries }) => !stale && setHistory({ no: orderNo, entries }))
            .catch(() => !stale && setHistory({ no: orderNo, entries: [] }));
        return () => {
            stale = true;
        };
        // orderStatus: re-fetch after a status change so the new entry appears.
    }, [open, orderNo, orderStatus]);

    if (!order) return null;
    const refunded = order.refund?.amount ?? (justRefunded?.no === order.no ? justRefunded.amount : 0);

    function handleStatusChange(next: AdminOrderStatus) {
        if (!order) return;
        if (next === CANCELLED_STATUS && order.status !== CANCELLED_STATUS) {
            // Don't mutate yet — the <select> stays bound to order.status until the cancel is confirmed.
            setPendingCancel(true);
            return;
        }
        onStatusChange(order.no, next);
    }

    return (
        <>
            <Modal open={open} onClose={onClose} maxWidth="max-w-[480px]">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-white py-5 pl-8 pr-16">
                    <div className="min-w-0">
                        <h3 className="text-lg font-medium text-ink">{order.no}</h3>
                        <p className="mt-1 font-mono text-[11px] text-grey">{order.date}</p>
                    </div>
                    <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(e.target.value as AdminOrderStatus)}
                        aria-label="Order status"
                        className="h-11 flex-none rounded-none border border-ink/10 px-3.5 text-[12.5px] text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                    >
                        {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-b border-ink/10 px-5 py-5 text-[13.5px] sm:px-8">
                    <dt className="text-grey">Customer:</dt>
                    <dd className="min-w-0 break-words text-ink">{order.customer}</dd>
                    <dt className="text-grey">Email:</dt>
                    <dd className="min-w-0 break-all text-ink">{order.email}</dd>
                    <dt className="text-grey">Address:</dt>
                    <dd className="min-w-0 break-words text-ink">{order.address}</dd>
                </dl>

                <div className="border-t border-ink/10 px-5 sm:px-8 py-6">
                    <span className="mb-3 block font-mono text-[10px] tracking-[.14em] text-grey uppercase">Items</span>
                    <div className="flex flex-col gap-3">
                        {order.items.map((line) => {
                            const product = getProduct(line.productId);
                            // Orders carry a name/price snapshot; the live catalogue is only a fallback and for the thumbnail.
                            const name = line.name ?? product?.title;
                            if (!name) return null;
                            const unitPrice = line.unitPrice ?? (product ? currentPrice(product) : 0);
                            return (
                                <div key={`${line.productId}-${name}`} className="flex items-center gap-3">
                                    <div className="relative h-11 w-11 flex-none overflow-hidden border border-ink/10">
                                        {product && <Image src={product.image} alt="" fill sizes="44px" className="object-cover" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[13.5px] text-ink">{name}</div>
                                        <div className="font-mono text-[10px] tracking-[.1em] text-grey uppercase">Qty {line.qty}</div>
                                    </div>
                                    <div className="flex-none font-mono text-[13px] text-ink">₱{(unitPrice * line.qty).toLocaleString()}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-ink/10 px-5 sm:px-8 py-6">
                    <span className="mb-3 block font-mono text-[10px] tracking-[.14em] text-grey uppercase">Payment</span>
                    {!order.payment || order.payment.proofs.length === 0 ? (
                        <p className="text-[12.5px] text-grey">
                            {order.status === "Pending" ? "No payment screenshot yet. The customer sees the payment details and can upload one." : "No screenshot was uploaded for this order."}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {order.payment.proofs.map((p) => {
                                const method = PAYMENT_METHOD_LABEL[p.method as PaymentMethodId] ?? p.method;
                                return (
                                    <div key={p.id} className="border border-ink/10 p-3.5">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <span className="text-[13px] text-ink">
                                                {method}
                                                {p.reference ? <span className="font-mono text-[11.5px] text-grey"> · ref {p.reference}</span> : null}
                                            </span>
                                            <span className={`font-mono text-[10.5px] tracking-[.1em] uppercase ${p.status === "APPROVED" ? "text-success-dark" : p.status === "REJECTED" ? "text-alert" : "text-pink-dark"}`}>
                                                {p.status === "PENDING" ? "Needs review" : p.status.toLowerCase()}
                                            </span>
                                        </div>
                                        <ProofImage orderNo={order.no} proofId={p.id} className="mb-2 max-h-72 w-full border border-ink/10 object-contain" />
                                        <div className="text-[11.5px] text-grey">
                                            Sent {new Date(p.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                            {p.reviewedBy ? ` · ${p.status === "APPROVED" ? "approved" : "rejected"} by ${p.reviewedBy}` : ""}
                                            {p.rejectReason ? ` — ${p.rejectReason}` : ""}
                                        </div>
                                        {p.status === "PENDING" && (
                                            rejecting === p.id ? (
                                                <div className="mt-3">
                                                    <textarea
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        rows={2}
                                                        maxLength={300}
                                                        placeholder="Why? The customer will see this (e.g. amount is lower than the total)"
                                                        aria-label="Reason for rejecting"
                                                        className={`${FIELD_INPUT} mb-2`}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            disabled={reviewing || reason.trim().length < 3}
                                                            onClick={async () => {
                                                                setReviewing(true);
                                                                if (await onReviewPayment(order.no, p.id, { decision: "reject", reason: reason.trim() })) {
                                                                    setRejecting(null);
                                                                    setReason("");
                                                                }
                                                                setReviewing(false);
                                                            }}
                                                            className={`flex-1 ${BTN_PRIMARY}`}
                                                        >
                                                            {reviewing ? "Rejecting…" : "Reject screenshot"}
                                                        </button>
                                                        <button onClick={() => setRejecting(null)} disabled={reviewing} className="border border-ink/15 px-4 text-[12.5px] text-ink hover:bg-off">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        disabled={reviewing}
                                                        onClick={async () => {
                                                            setReviewing(true);
                                                            await onReviewPayment(order.no, p.id, { decision: "approve" });
                                                            setReviewing(false);
                                                        }}
                                                        className={`flex-1 ${BTN_PRIMARY}`}
                                                    >
                                                        {reviewing ? "Saving…" : `Approve — mark Paid (₱${orderTotal(order).toLocaleString()})`}
                                                    </button>
                                                    <button onClick={() => setRejecting(p.id)} disabled={reviewing} className="border border-ink/15 px-4 text-[12.5px] text-ink hover:bg-off">
                                                        Reject
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="border-t border-ink/10 px-5 sm:px-8 py-6">
                    <span className="mb-3 block font-mono text-[10px] tracking-[.14em] text-grey uppercase">History</span>
                    {history?.no !== order.no ? (
                        <p className="text-[12.5px] text-grey">Loading…</p>
                    ) : history.entries.length === 0 ? (
                        <p className="text-[12.5px] text-grey">No history recorded for this order.</p>
                    ) : (
                        <ol className="flex flex-col gap-3">
                            {history.entries.map((h) => (
                                <li key={h.id} className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-[13px] text-ink">
                                            {h.from ? `${statusLabel(h.from)} → ${statusLabel(h.to)}` : "Order placed"}
                                        </div>
                                        <div className="text-[11.5px] text-grey">
                                            {h.actor.name}
                                            {h.note ? ` · ${h.note}` : ""}
                                        </div>
                                    </div>
                                    <time dateTime={h.createdAt} className="flex-none font-mono text-[11px] text-grey">
                                        {new Date(h.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                    </time>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                <div className="border-t border-ink/10 px-5 sm:px-8 py-6">
                    <span className="mb-3 block font-mono text-[10px] tracking-[.14em] text-grey uppercase">Money</span>
                    <div className="flex flex-col gap-1.5 text-[13px] text-grey">
                        <div className="flex justify-between"><span>Items</span><span className="font-mono text-ink">₱{(order.subtotal ?? orderTotal(order)).toLocaleString()}</span></div>
                        {(order.discount ?? 0) > 0 && (
                            <div className="flex justify-between"><span>Discount{order.voucherCode ? ` · ${order.voucherCode}` : ""}</span><span className="font-mono text-ink">−₱{order.discount!.toLocaleString()}</span></div>
                        )}
                        <div className="flex justify-between"><span>Shipping</span><span className="font-mono text-ink">{(order.shippingFee ?? 0) > 0 ? `₱${order.shippingFee!.toLocaleString()}` : "Free"}</span></div>
                    </div>

                    {order.status === "Cancelled" && !order.paidAt && !refunded && isAdministrator(currentStaffMember) && (
                        <div className="mt-4">
                            <p className="mb-2 text-[12px] leading-relaxed text-grey">Cancelled by mistake (for example, the customer was still paying)? Reopening takes the items out of stock again, and fails if they&apos;ve sold since.</p>
                            <button
                                disabled={reopening}
                                onClick={async () => {
                                    setReopening(true);
                                    await reopenOrder(order.no);
                                    setReopening(false);
                                }}
                                className="border border-ink/15 px-4 py-2.5 text-[12.5px] text-ink transition hover:bg-off disabled:opacity-50"
                            >
                                {reopening ? "Reopening…" : "Reopen this order"}
                            </button>
                        </div>
                    )}

                    {refunded ? (
                        <p className="mt-4 border-l-2 border-pink-dark bg-pink-soft/40 px-3 py-2 text-[12.5px] text-ink">
                            Refunded ₱{refunded.toLocaleString()}
                            {order.refund ? ` on ${new Date(order.refund.at).toLocaleDateString([], { dateStyle: "medium" })}` : ""}
                            {order.refund?.note ? ` — ${order.refund.note}` : ""}
                        </p>
                    ) : (
                        order.paidAt && isAdministrator(currentStaffMember) && (
                            refundOpen ? (
                                <div className="mt-4">
                                    <p className="mb-2 text-[12px] leading-relaxed text-grey">Send the money back yourself (GCash / bank), then record it here. This doesn&apos;t move any money.</p>
                                    <input
                                        type="number"
                                        min={1}
                                        max={orderTotal(order)}
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        placeholder={`Amount (up to ₱${orderTotal(order).toLocaleString()})`}
                                        aria-label="Refund amount"
                                        className={`${FIELD_INPUT} mb-2`}
                                    />
                                    <input value={refundNote} onChange={(e) => setRefundNote(e.target.value)} maxLength={300} placeholder="Note (optional)" aria-label="Refund note" className={`${FIELD_INPUT} mb-2`} />
                                    <div className="flex gap-2">
                                        <button
                                            disabled={refunding || !(Number(refundAmount) >= 1 && Number(refundAmount) <= orderTotal(order))}
                                            onClick={async () => {
                                                setRefunding(true);
                                                const amount = Math.floor(Number(refundAmount));
                                                if (await refundOrder(order.no, { amount, note: refundNote.trim() || undefined })) {
                                                    setJustRefunded({ no: order.no, amount });
                                                    setRefundOpen(false);
                                                }
                                                setRefunding(false);
                                            }}
                                            className={`flex-1 ${BTN_PRIMARY}`}
                                        >
                                            {refunding ? "Recording…" : "Record refund"}
                                        </button>
                                        <button onClick={() => setRefundOpen(false)} disabled={refunding} className="border border-ink/15 px-4 text-[12.5px] text-ink hover:bg-off">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setRefundOpen(true)} className="mt-4 border border-ink/15 px-4 py-2.5 text-[12.5px] text-ink transition hover:bg-off">Record a refund</button>
                            )
                        )
                    )}
                </div>

                <div className="sticky bottom-0 flex justify-between border-t border-ink/10 bg-white px-5 sm:px-8 py-5 text-[15px] font-semibold text-ink">
                    <span>Total</span>
                    <span>₱{orderTotal(order).toLocaleString()}</span>
                </div>
            </Modal>

            <ConfirmModal
                open={pendingCancel}
                title="Cancel this order?"
                description={`Order ${order.no} will be marked Cancelled — this is visible to ${order.customer} and can't be undone from here.${order.paidAt ? " It was already paid: cancelling does not send the money back, so record a refund afterwards." : ""}`}
                confirmLabel="Cancel Order"
                loadingLabel="Cancelling…"
                cancelLabel="Keep Order"
                onConfirm={() => onStatusChange(order.no, CANCELLED_STATUS)}
                onClose={() => setPendingCancel(false)}
            />
        </>
    );
}
