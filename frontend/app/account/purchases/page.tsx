"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Image from "next/image";
import { ORDER_STATUS_TABS, Order, OrderStatus } from "@/library/orders";
import { ApiError } from "@/library/api/client";
import { cancelMyOrder, listMyOrders, toCustomerOrder } from "@/library/api/orders";
import PaymentProofModal from "@/components/modals/PaymentProofModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { getProduct } from "@/library/products";
import { useStore } from "@/library/store";
import Pagination from "@/components/ui/Pagination";
import PageHeading from "@/components/ui/PageHeading";
import Modal from "@/components/ui/Modal";
import SearchField, { FILTER_SELECT } from "@/components/ui/SearchField";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

type SortKey = "date-desc" | "date-asc" | "total-desc" | "total-asc";

const PAGE_SIZE = 10;

// Unit price/qty/total are clustered as one "amount" column, not split tracks.
const ROW_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_140px_170px] sm:items-center";
const HEADER_GRID = "mb-3 hidden gap-4 border-b border-ink/10 pb-3 font-mono text-label uppercase tracking-[.14em] text-grey sm:grid sm:grid-cols-[minmax(0,1fr)_140px_170px]";

function formatDate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// An unpaid order's button follows its payment screenshot: nothing to do while staff are checking it.
function primaryAction(o: Order): string | null {
    if (o.awaitingPayment) {
        if (o.payment?.state === "review") return null;
        return o.payment?.state === "rejected" ? "Upload New Screenshot" : "Pay Now";
    }
    return PRIMARY_ACTION[o.status];
}

const PRIMARY_ACTION: Record<OrderStatus, string | null> = {
    "To Ship": "Track Package",
    "To Receive": "Confirm Receipt",
    Completed: "Buy Again",
    Cancelled: "Buy Again",
    "Return Refund": "View Refund Status",
};

const STATUS_DOT: Record<OrderStatus, string> = {
    "To Ship": "bg-navy",
    "To Receive": "bg-navy",
    Completed: "bg-success",
    Cancelled: "bg-ink/25",
    "Return Refund": "bg-ink/25",
};

function StatusTag({ status }: { status: OrderStatus }) {
    return (
        <span className="inline-flex items-center gap-1.5 font-mono text-label uppercase tracking-[.1em] text-ink/70">
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
            {status}
        </span>
    );
}

// `compact` shows a smaller inline strip directly in the row, no modal needed.
function OrderTracker({ order, compact = false }: { order: Order; compact?: boolean }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    if (order.steps.length === 0) {
        const isCancelled = order.status === "Cancelled";
        return (
            <div className={`flex flex-col items-center gap-3 ${compact ? "" : "pb-6 pt-2"}`}>
                <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ease-out ${
                        mounted ? "scale-100 opacity-100" : "scale-50 opacity-0"
                    } ${isCancelled ? "border-ink/15 text-grey" : "border-pink-dark/30 text-pink-dark"}`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        {isCancelled ? (
                            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                        ) : (
                            <path
                                d="M4 4v6h6M20 20v-6h-6M4.5 9a8 8 0 0114-4.5M19.5 15a8 8 0 01-14 4.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}
                    </svg>
                </span>
                <p className="text-center text-meta text-grey">{order.eta}</p>
            </div>
        );
    }

    const n = order.steps.length;
    const complete = order.current >= n - 1;
    const inset = 50 / n;
    const track = 100 - inset * 2;
    const filled = n > 1 ? (order.current / (n - 1)) * track : 0;
    const dotSize = compact ? "h-4 w-4" : "h-6 w-6";
    const dotTop = compact ? "top-4" : "top-6";

    return (
        <div className={compact ? "" : "pb-6 pt-2"}>
            <div className={`relative flex justify-between ${compact ? "mb-1.5" : "mb-5 pt-3"}`}>
                <div className={`absolute ${dotTop} h-px bg-ink/10`} style={{ left: `${inset}%`, right: `${inset}%` }} />
                <div
                    className={`absolute ${dotTop} h-px bg-success transition-[width] duration-700 ease-out`}
                    style={{ left: `${inset}%`, width: mounted ? `${filled}%` : 0 }}
                />
                {order.steps.map((s, i) => {
                    const done = i <= order.current;
                    const isNext = i === order.current + 1 && !complete;

                    return (
                        <div key={s} className="relative z-10 flex flex-1 flex-col items-center gap-2 text-center">
                            <div className={`relative flex items-center justify-center ${dotSize}`}>
                                <div
                                    className={`relative flex items-center justify-center rounded-full border text-label ${dotSize} ${done ? "border-success bg-success text-white" : isNext ? "border-navy/40 bg-white text-navy/50" : "border-ink/15 bg-white text-grey"}`}
                                >
                                    {done ? (
                                        <svg width={compact ? 8 : 10} height={compact ? 8 : 10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <span className="h-1 w-1 rounded-full bg-current" />
                                    )}
                                </div>
                            </div>
                            {!compact && (
                                <span
                                    className={`text-label transition-colors duration-500 ${
                                        done || isNext ? "font-medium text-ink" : "text-grey/70"
                                    }`}
                                >
                                    {s}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            <p className={`text-center text-grey ${compact ? "text-label" : "text-meta"}`}>
                {compact ? `${order.steps[order.current]} — ${order.eta}` : order.eta}
            </p>
        </div>
    );
}

export default function PurchasesPage() {
    const { showToast, isLoggedIn } = useStore();
    const [tab, setTab] = useState<(typeof ORDER_STATUS_TABS)[number]>("All");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("date-desc");
    const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const mounted = useMounted();

    const [orders, setOrders] = useState<Record<string, Order>>({});
    const [ordersLoaded, setOrdersLoaded] = useState(false);
    const [cancelNo, setCancelNo] = useState<string | null>(null);
    const [payOrderNo, setPayOrderNo] = useState<string | null>(null);

    async function loadOrders() {
        try {
            const { orders: list } = await listMyOrders();
            setOrders(Object.fromEntries(list.map((o) => [o.no, toCustomerOrder(o)])));
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not load your orders.");
        } finally {
            setOrdersLoaded(true);
        }
    }

    useEffect(() => {
        // Fetch on sign-in; state is set after the awaited request, not synchronously.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isLoggedIn) void loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- loadOrders only closes over stable setters
    }, [isLoggedIn]);

    async function cancelOrder(no: string) {
        try {
            await cancelMyOrder(no);
            showToast("success", `Order ${no} cancelled.`);
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not cancel that order.");
        }
        await loadOrders();
    }

    // After checkout the cart sends the customer here with ?pay=<order>; open that order's payment dialog once.
    useEffect(() => {
        if (!ordersLoaded) return;
        const no = new URLSearchParams(window.location.search).get("pay");
        if (!no) return;
        window.history.replaceState(null, "", window.location.pathname);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time reaction to the URL once the orders have loaded
        if (orders[no]?.awaitingPayment) setPayOrderNo(no);
    }, [ordersLoaded, orders]);

    const orderNos = useMemo(() => Object.keys(orders), [orders]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = orderNos.filter((no) => {
            const o = orders[no];
            if (tab !== "All" && o.status !== tab) return false;
            if (q && !no.toLowerCase().includes(q) && !o.product.toLowerCase().includes(q)) return false;
            return true;
        });
        const sorted = [...list];
        switch (sort) {
            case "date-desc":
                sorted.sort((a, b) => orders[b].date.localeCompare(orders[a].date));
                break;
            case "date-asc":
                sorted.sort((a, b) => orders[a].date.localeCompare(orders[b].date));
                break;
            case "total-desc":
                sorted.sort((a, b) => orders[b].total - orders[a].total);
                break;
            case "total-asc":
                sorted.sort((a, b) => orders[a].total - orders[b].total);
                break;
        }
        return sorted;
    }, [tab, query, sort, orderNos, orders]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    useScrollTopOnChange(currentPage);

    function selectTab(t: (typeof ORDER_STATUS_TABS)[number]) {
        setTab(t);
        setPage(1);
    }

    function search(value: string) {
        setQuery(value);
        setPage(1);
    }

    function sortBy(value: SortKey) {
        setSort(value);
        setPage(1);
    }

    function runAction(label: string, orderNo: string) {
        if (label === "Pay Now" || label === "Upload New Screenshot") {
            setPayOrderNo(orderNo);
            return;
        }
        // TODO: tracking, receipt confirmation and reorder still need endpoints.
        showToast("success", `"${label}" isn't available yet.`);
    }

    if (!mounted || !ordersLoaded) return <PurchasesSkeleton />;

    return (
        <div>
            <PageHeading action={<span className="font-mono text-label text-grey">{filtered.length} Orders</span>}>
                My Purchase
            </PageHeading>

            <div className="mb-6 flex flex-wrap gap-x-7 gap-y-2 border-b border-ink/10 font-mono text-label uppercase tracking-[.1em]">
                {ORDER_STATUS_TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => selectTab(t)}
                        className={`relative pb-2.5 transition ${tab === t ? "text-pink-dark" : "text-grey hover:text-ink"}`}
                    >
                        {t}
                        {tab === t && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-pink-dark" />}
                    </button>
                ))}
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-3">
                <SearchField value={query} onChange={search} placeholder="Search by Order ID or Product name" />
                <select value={sort} onChange={(e) => sortBy(e.target.value as SortKey)} className={FILTER_SELECT}>
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                    <option value="total-desc">Total (High–Low)</option>
                    <option value="total-asc">Total (Low–High)</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <EmptyState title={query ? "No matches" : "No orders here"} message={query ? "No orders match your search." : "No orders in this status."} action={{ label: "Browse the catalogue", href: "/shop" }} />
            ) : (
                <>
                    <div className={HEADER_GRID}>
                        <span>Product</span>
                        <span className="text-right">Amount</span>
                        <span className="text-right">Actions</span>
                    </div>

                    <div className="flex flex-col divide-y divide-ink/10 border-b border-ink/10">
                        {paged.map((no) => {
                            const o = orders[no];
                            const p = getProduct(o.productId);
                            const unitPrice = o.total / o.qty;
                            const primary = primaryAction(o);

                            return (
                                <div
                                    key={no}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedOrderNo(no)}
                                    onKeyDown={(e) => {
                                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                            e.preventDefault();
                                            setSelectedOrderNo(no);
                                        }
                                    }}
                                    className="-mx-3 cursor-pointer px-3 py-4 transition hover:bg-off/50"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-4">
                                        <span className="font-mono text-label text-grey">
                                            Order {no} <span className="text-ink/20">·</span> {formatDate(o.date)}
                                        </span>
                                        <StatusTag status={o.status} />
                                    </div>

                                    <div className={ROW_GRID}>
                                        <div className="flex min-w-0 items-center gap-4">
                                            {p && (
                                                <div className="relative h-16 w-16 flex-none overflow-hidden border border-ink/10">
                                                    <Image src={p.image} alt={o.product} fill sizes="64px" className="object-cover" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="truncate text-small text-ink">{o.product}</div>
                                                {p && (
                                                    <div className="font-mono text-label uppercase tracking-[.14em] text-grey">{p.category}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unit price, qty and total are one calculation, so they're one visual cluster. */}
                                        <div className="flex items-center justify-between sm:block sm:text-right">
                                            <span className="font-mono text-label uppercase text-grey sm:hidden">Amount</span>
                                            <div className="sm:text-right">
                                                <div className="font-mono text-label text-grey">
                                                    {o.items && o.items.length > 1 ? `${o.qty} items` : `₱${unitPrice.toLocaleString()} × ${o.qty}`}
                                                </div>
                                                <div className="font-mono text-body font-semibold text-ink">₱{o.total.toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <div className="flex sm:justify-end">
                                            {primary && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        runAction(primary, no);
                                                    }}
                                                    className="ui-btn ui-btn-accent ui-btn-sm"
                                                >
                                                    {primary}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <Modal
                open={selectedOrderNo !== null}
                onClose={() => setSelectedOrderNo(null)}
                maxWidth="max-w-[460px]"
                eyebrow="Order"
                heading={selectedOrderNo ?? "Order"}
                footer={
                    selectedOrderNo && orders[selectedOrderNo] && primaryAction(orders[selectedOrderNo]) ? (
                        <>
                            <div className="sm:mr-auto">
                                <p className="font-mono text-label uppercase tracking-[.14em] text-grey">Order total</p>
                                <p className="font-mono text-body font-semibold text-ink">₱{orders[selectedOrderNo].total.toLocaleString()}</p>
                            </div>
                            {orders[selectedOrderNo].awaitingPayment && (
                                <button onClick={() => setCancelNo(selectedOrderNo)} className="ui-btn ui-btn-ghost ui-btn-sm">
                                    Cancel this order
                                </button>
                            )}
                            <button onClick={() => runAction(primaryAction(orders[selectedOrderNo])!, selectedOrderNo)} className="ui-btn ui-btn-primary">
                                {primaryAction(orders[selectedOrderNo])}
                            </button>
                        </>
                    ) : undefined
                }
            >
                {selectedOrderNo && (() => {
                    const o = orders[selectedOrderNo];

                    return (
                        <>
                            <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-5">
                                <StatusTag status={o.status} />
                                <span className="text-meta text-grey">{formatDate(o.date)}</span>
                            </div>

                            <div className="pt-6">
                                <div className="flex flex-col gap-4">
                                    {(o.items ?? []).map((line) => {
                                        const lp = getProduct(line.productId);
                                        return (
                                            <div key={`${line.productId}-${line.name}`} className="flex items-center gap-4">
                                                {lp && (
                                                    <div className="relative h-16 w-16 flex-none overflow-hidden border border-ink/10">
                                                        <Image src={lp.image} alt={line.name} fill sizes="64px" className="object-cover" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-body text-ink">{line.name}</div>
                                                    {lp && <div className="font-mono text-label uppercase tracking-[.14em] text-grey">{lp.category}</div>}
                                                    <div className="mt-1 font-mono text-meta text-grey">
                                                        ₱{line.unitPrice.toLocaleString()} × {line.qty}
                                                    </div>
                                                </div>
                                                <span className="font-mono text-body font-semibold text-ink">₱{(line.unitPrice * line.qty).toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {o.subtotal !== undefined && ((o.discount ?? 0) > 0 || (o.shippingFee ?? 0) > 0) && (
                                    <div className="mt-6 flex flex-col gap-1.5 border-t border-ink/10 pt-6 text-small text-grey">
                                        <div className="flex justify-between"><span>Items</span><span className="font-mono text-ink">₱{o.subtotal.toLocaleString()}</span></div>
                                        {(o.discount ?? 0) > 0 && (
                                            <div className="flex justify-between"><span>Discount{o.voucherCode ? ` · ${o.voucherCode}` : ""}</span><span className="font-mono text-success-dark">−₱{o.discount!.toLocaleString()}</span></div>
                                        )}
                                        <div className="flex justify-between"><span>Shipping</span><span className={`font-mono ${(o.shippingFee ?? 0) > 0 ? "text-ink" : "text-success-dark"}`}>{(o.shippingFee ?? 0) > 0 ? `₱${o.shippingFee!.toLocaleString()}` : "Free"}</span></div>
                                    </div>
                                )}

                                {o.refund && (
                                    <p className="mt-6 border-l-2 border-pink-dark bg-pink-soft/40 px-3 py-2 text-small text-ink">
                                        We refunded ₱{o.refund.amount.toLocaleString()} on {new Date(o.refund.at).toLocaleDateString([], { dateStyle: "medium" })}
                                        {o.refund.note ? ` — ${o.refund.note}` : ""}. It may take a little while to show in your account.
                                    </p>
                                )}

                                <div className="mt-6 border-t border-ink/10 pt-6">
                                    <p className="mb-1 font-mono text-label uppercase tracking-[.14em] text-grey">Status</p>
                                    <OrderTracker order={o} />
                                </div>
                            </div>

                        </>
                    );
                })()}
            </Modal>

            {payOrderNo && orders[payOrderNo] && (
                <PaymentProofModal
                    orderNo={payOrderNo}
                    total={orders[payOrderNo].total}
                    onClose={() => setPayOrderNo(null)}
                    onSubmitted={() => void loadOrders()}
                    showToast={showToast}
                />
            )}

            <ConfirmModal
                open={cancelNo !== null}
                title="Cancel this order?"
                description={`Order ${cancelNo ?? ""} will be cancelled and the items released. This can't be undone.`}
                confirmLabel="Cancel Order"
                loadingLabel="Cancelling…"
                cancelLabel="Keep Order"
                onConfirm={() => cancelNo && cancelOrder(cancelNo)}
                onClose={() => setCancelNo(null)}
            />
        </div>
    );
}

function PurchasesSkeleton() {
    return (
        <div>
            <SkeletonGroup>
                <div className="mb-6 flex h-10 items-center justify-between border-b border-ink/10 pb-4">
                    <Skeleton className="h-[18px] w-32" />
                    <Skeleton className="h-3 w-16" />
                </div>

                <div className="mb-6 flex flex-wrap gap-x-7 gap-y-2 border-b border-ink/10 pb-2.5">
                    {ORDER_STATUS_TABS.map((t) => (
                        <Skeleton key={t} className="h-[11px] w-14" />
                    ))}
                </div>

                <div className="mb-8 flex flex-wrap items-center gap-3">
                    <Skeleton tone="outline" className="h-10 w-64" />
                    <Skeleton tone="outline" className="h-10 w-52" />
                </div>

                <div className={HEADER_GRID}>
                    <Skeleton className="h-[10px] w-16" />
                    <Skeleton className="ml-auto h-[10px] w-16" />
                    <Skeleton className="ml-auto h-[10px] w-14" />
                </div>

                <div className="flex flex-col divide-y divide-ink/10 border-b border-ink/10">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="-mx-3 px-3 py-4">
                            <div className="mb-3 flex items-center justify-between gap-4">
                                <Skeleton className="h-[11px] w-40" />
                                <Skeleton className="h-[11px] w-20" />
                            </div>

                            <div className={ROW_GRID}>
                                <div className="flex min-w-0 items-center gap-4">
                                    <Skeleton tone="faint" className="h-16 w-16 flex-none" />
                                    <div className="min-w-0 flex-1">
                                        <Skeleton className="mb-2 h-[13.5px] w-40" />
                                        <Skeleton tone="soft" className="h-[10px] w-20" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:block sm:text-right">
                                    <Skeleton tone="soft" className="h-[11px] w-12 sm:hidden" />
                                    <div>
                                        <Skeleton tone="soft" className="mb-1.5 h-[11px] w-20 sm:ml-auto" />
                                        <Skeleton className="h-[14px] w-16 sm:ml-auto" />
                                    </div>
                                </div>
                                <Skeleton tone="outline" className="h-8 w-28 sm:ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center gap-2">
                    <Skeleton tone="outline" className="h-9 w-9" />
                    <Skeleton tone="outline" className="h-9 w-9" />
                    <Skeleton tone="outline" className="h-9 w-9" />
                </div>
            </SkeletonGroup>
        </div>
    );
}
