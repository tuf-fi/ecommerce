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
    const [pendingStatus, setPendingStatus] = useState<AdminOrderStatus | null>(null);
    // Keeps the dialog text stable while it fades out.
    const [lastInfo, setLastInfo] = useState<{ status: AdminOrderStatus; movingBack: boolean; paid: boolean }>({ status: CANCELLED_STATUS, movingBack: false, paid: false });
    const shownStatus = pendingStatus ?? lastInfo.status;
    const movingBack = lastInfo.movingBack;
    const [prevOrderNo, setPrevOrderNo] = useState(order?.no);
    if (order?.no !== prevOrderNo) {
        setPrevOrderNo(order?.no);
        setPendingStatus(null);
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

    // Every status change tells the customer, so it is confirmed first; the <select> stays bound to order.status until then.
    function handleStatusChange(next: AdminOrderStatus) {
        if (!order || next === order.status) return;
        setLastInfo({ status: next, movingBack: next !== CANCELLED_STATUS && ORDER_STATUSES.indexOf(next) < ORDER_STATUSES.indexOf(order.status), paid: !!order.paidAt });
        setPendingStatus(next);
    }

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                maxWidth="max-w-[480px]"
                eyebrow={order.date}
                heading={order.no}
                flush
                headerAction={
                    <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(e.target.value as AdminOrderStatus)}
                        aria-label="Order status"
                        className="ui-select h-11 w-auto py-0 text-meta"
                    >
                        {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                }
            >

                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 px-5 py-5 text-small sm:px-8">
                    <dt className="text-grey">Customer</dt>
                    <dd className="min-w-0 break-words text-ink">{order.customer}</dd>
                    <dt className="text-grey">Email</dt>
                    <dd className="min-w-0 break-all text-ink">{order.email}</dd>
                    <dt className="text-grey">Mobile</dt>
                    <dd className="min-w-0 break-all text-ink">{order.phone ?? "—"}</dd>
                    <dt className="text-grey">Address</dt>
                    <dd className="min-w-0 break-words text-ink">{order.address}</dd>
                </dl>

                <div className="border-t border-ink/10 px-5 sm:px-8 py-6">
                    <span className="mb-3 block font-mono text-label tracking-[.14em] text-grey uppercase">Items</span>
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
                                        <div className="truncate text-small text-ink">{name}</div>
                                        <div className="font-mono text-label tracking-[.1em] text-grey uppercase">Qty {line.qty}</div>
                                    </div>
                                    <div className="flex-none font-mono text-small text-ink">₱{(unitPrice * line.qty).toLocaleString()}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-ink/10 px-5 sm:px-8 py-6">
                    <span className="mb-3 block font-mono text-label tracking-[.14em] text-grey uppercase">Payment</span>
                    {!order.payment || order.payment.proofs.length === 0 ? (
                        <p className="text-meta text-grey">
                            {order.status === "Pending" ? "No payment screenshot yet. The customer sees the payment details and can upload one." : "No screenshot was uploaded for this order."}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {order.payment.proofs.map((p) => {
                                const method = PAYMENT_METHOD_LABEL[p.method as PaymentMethodId] ?? p.method;
                                return (
                                    <div key={p.id} className="border border-ink/10 p-3.5">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <span className="text-small text-ink">
                                                {method}
                                                {p.reference ? <span className="font-mono text-label text-grey"> · ref {p.reference}</span> : null}
                                            </span>
                                            <span className={`font-mono text-label tracking-[.1em] uppercase ${p.status === "APPROVED" ? "text-success-dark" : p.status === "REJECTED" ? "text-alert" : "text-pink-dark"}`}>
                                                {p.status === "PENDING" ? "Needs review" : p.status.toLowerCase()}
                                            </span>
                                        </div>
                                        {p.duplicateOf.length > 0 && (
                                            <p className="mb-2 border-l-2 border-alert bg-alert/5 px-3 py-2 text-meta text-ink">
                                                The same reference was used on {p.duplicateOf.join(", ")}. Check that this isn&apos;t one screenshot reused.
                                            </p>
                                        )}
                                        {(p.amount !== null || p.senderName) && (
                                            <p className={`mb-2 text-meta ${p.amount !== null && p.amount !== orderTotal(order) ? "font-medium text-alert" : "text-grey"}`}>
                                                {p.amount !== null && <>Customer says they sent ₱{p.amount.toLocaleString()}{p.amount !== orderTotal(order) ? ` — order total is ₱${orderTotal(order).toLocaleString()}` : ""}</>}
                                                {p.senderName ? `${p.amount !== null ? " · " : ""}from ${p.senderName}` : ""}
                                            </p>
                                        )}
                                        <ProofImage orderNo={order.no} proofId={p.id} className="mb-2 max-h-72 w-full border border-ink/10 object-contain" />
                                        <div className="text-label text-grey">
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
                                                        <button onClick={() => setRejecting(null)} disabled={reviewing} className="ui-btn ui-btn-secondary ui-btn-sm">
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
                                                    <button onClick={() => setRejecting(p.id)} disabled={reviewing} className="ui-btn ui-btn-secondary ui-btn-sm">
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
                    <span className="mb-3 block font-mono text-label tracking-[.14em] text-grey uppercase">History</span>
                    {history?.no !== order.no ? (
                        <p className="text-meta text-grey">Loading…</p>
                    ) : history.entries.length === 0 ? (
                        <p className="text-meta text-grey">No history recorded for this order.</p>
                    ) : (
                        <ol className="flex flex-col gap-3">
                            {history.entries.map((h) => (
                                <li key={h.id} className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-small text-ink">
                                            {h.from ? `${statusLabel(h.from)} → ${statusLabel(h.to)}` : "Order placed"}
                                        </div>
                                        <div className="text-label text-grey">
                                            {h.actor.name}
                                            {h.note ? ` · ${h.note}` : ""}
                                        </div>
                                    </div>
                                    <time dateTime={h.createdAt} className="flex-none font-mono text-label text-grey">
                                        {new Date(h.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                    </time>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                <div className="border-t border-ink/10 px-5 sm:px-8 py-6">
                    <span className="mb-3 block font-mono text-label tracking-[.14em] text-grey uppercase">Money</span>
                    <div className="flex flex-col gap-1.5 text-small text-grey">
                        <div className="flex justify-between"><span>Items</span><span className="font-mono text-ink">₱{(order.subtotal ?? orderTotal(order)).toLocaleString()}</span></div>
                        {(order.discount ?? 0) > 0 && (
                            <div className="flex justify-between"><span>Discount{order.voucherCode ? ` · ${order.voucherCode}` : ""}</span><span className="font-mono text-ink">−₱{order.discount!.toLocaleString()}</span></div>
                        )}
                        <div className="flex justify-between"><span>Shipping</span><span className="font-mono text-ink">{(order.shippingFee ?? 0) > 0 ? `₱${order.shippingFee!.toLocaleString()}` : "Free"}</span></div>
                    </div>

                    {order.status === "Cancelled" && !order.paidAt && !refunded && isAdministrator(currentStaffMember) && (
                        <div className="mt-4">
                            <p className="mb-2 text-meta leading-relaxed text-grey">Cancelled by mistake (for example, the customer was still paying)? Reopening takes the items out of stock again, and fails if they&apos;ve sold since.</p>
                            <button
                                disabled={reopening}
                                onClick={async () => {
                                    setReopening(true);
                                    await reopenOrder(order.no);
                                    setReopening(false);
                                }}
                                className="ui-btn ui-btn-secondary ui-btn-sm"
                            >
                                {reopening ? "Reopening…" : "Reopen this order"}
                            </button>
                        </div>
                    )}

                    {refunded ? (
                        <p className="mt-4 border-l-2 border-pink-dark bg-pink-soft/40 px-3 py-2 text-meta text-ink">
                            Refunded ₱{refunded.toLocaleString()}
                            {order.refund ? ` on ${new Date(order.refund.at).toLocaleDateString([], { dateStyle: "medium" })}` : ""}
                            {order.refund?.note ? ` — ${order.refund.note}` : ""}
                        </p>
                    ) : (
                        order.paidAt && isAdministrator(currentStaffMember) && (
                            refundOpen ? (
                                <div className="mt-4">
                                    <p className="mb-2 text-meta leading-relaxed text-grey">Send the money back yourself (GCash / bank), then record it here. This doesn&apos;t move any money.</p>
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
                                        <button onClick={() => setRefundOpen(false)} disabled={refunding} className="ui-btn ui-btn-secondary ui-btn-sm">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setRefundOpen(true)} className="ui-btn ui-btn-secondary ui-btn-sm mt-4">Record a refund</button>
                            )
                        )
                    )}
                </div>

                <div className="sticky bottom-0 flex justify-between border-t border-ink/10 bg-white px-5 sm:px-8 py-5 text-body font-semibold text-ink">
                    <span>Total</span>
                    <span>₱{orderTotal(order).toLocaleString()}</span>
                </div>
            </Modal>

            <ConfirmModal
                open={pendingStatus !== null}
                title={shownStatus === CANCELLED_STATUS ? "Cancel this order?" : movingBack ? `Move back to ${shownStatus}?` : `Mark as ${shownStatus}?`}
                description={
                    shownStatus === CANCELLED_STATUS
                        ? `Order ${order.no} will be marked Cancelled. ${order.customer} is notified and it can't be undone from here.${lastInfo.paid ? " It was already paid: cancelling does not send the money back, so record a refund afterwards." : ""}`
                        : movingBack
                            ? `${order.customer} is notified that order ${order.no} moved back to ${shownStatus}. Only do this to correct a mistake.`
                            : `${order.customer} is notified that order ${order.no} is now ${shownStatus}.`
                }
                confirmLabel={shownStatus === CANCELLED_STATUS ? "Cancel order" : "Update status"}
                loadingLabel={shownStatus === CANCELLED_STATUS ? "Cancelling…" : "Updating…"}
                cancelLabel={shownStatus === CANCELLED_STATUS ? "Keep order" : "Cancel"}
                onConfirm={() => pendingStatus && onStatusChange(order.no, pendingStatus)}
                tone={shownStatus === CANCELLED_STATUS ? "destructive" : "neutral"}
                onClose={() => setPendingStatus(null)}
            />
        </>
    );
}
