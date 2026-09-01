"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ORDER_STATUS_TABS, SAMPLE_ORDERS, Order, OrderStatus } from "@/library/orders";
import { getProduct } from "@/library/products";
import { useStore } from "@/library/store";
import Pagination from "@/components/ui/Pagination";
import PageHeading from "@/components/ui/PageHeading";
import Modal from "@/components/ui/Modal";
import SearchField, { FILTER_SELECT } from "@/components/ui/SearchField";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";

type SortKey = "date-desc" | "date-asc" | "total-desc" | "total-asc";

const PAGE_SIZE = 10;

const ROW_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_110px_90px_120px_200px] sm:items-center";
const HEADER_GRID = "mb-3 hidden gap-4 border-b border-ink/10 pb-3 font-mono text-[10px] uppercase tracking-[.14em] text-grey sm:grid sm:grid-cols-[minmax(0,1fr)_110px_90px_120px_200px]";

function formatDate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PRIMARY_ACTION: Record<OrderStatus, string | null> = {
    "To Pay": "Pay Now",
    "To Ship": "Track Package",
    "To Receive": "Confirm Receipt",
    Completed: "Buy Again",
    Cancelled: "Buy Again",
    "Return Refund": "View Refund Status",
};

function OrderTracker({ order }: { order: Order }) {
    if (order.steps.length === 0) {
        return <p className="pb-5 text-center text-[12.5px] text-grey">{order.eta}</p>;
    }

    return (
        <div className="pb-5">
            <div className="mb-5 flex justify-between">
                {order.steps.map((s, i) => (
                    <div key={s} className="flex flex-1 flex-col items-center gap-2 text-center">
                        <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                                i <= order.current ? "border-navy bg-navy text-white" : "border-ink/20 text-ink/30"
                            }`}
                        >
                            {i <= order.current ? "✓" : ""}
                        </div>
                        <span className="text-[10.5px] text-grey">{s}</span>
                    </div>
                ))}
            </div>
            <p className="text-center text-[12.5px] text-grey">{order.eta}</p>
        </div>
    );
}

export default function PurchasesPage() {
    const { showToast } = useStore();
    const [tab, setTab] = useState<(typeof ORDER_STATUS_TABS)[number]>("All");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("date-desc");
    const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const orderNos = useMemo(() => Object.keys(SAMPLE_ORDERS), []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = orderNos.filter((no) => {
            const o = SAMPLE_ORDERS[no];
            if (tab !== "All" && o.status !== tab) return false;
            if (q && !no.toLowerCase().includes(q) && !o.product.toLowerCase().includes(q)) return false;
            return true;
        });
        const sorted = [...list];
        switch (sort) {
            case "date-desc":
                sorted.sort((a, b) => SAMPLE_ORDERS[b].date.localeCompare(SAMPLE_ORDERS[a].date));
                break;
            case "date-asc":
                sorted.sort((a, b) => SAMPLE_ORDERS[a].date.localeCompare(SAMPLE_ORDERS[b].date));
                break;
            case "total-desc":
                sorted.sort((a, b) => SAMPLE_ORDERS[b].total - SAMPLE_ORDERS[a].total);
                break;
            case "total-asc":
                sorted.sort((a, b) => SAMPLE_ORDERS[a].total - SAMPLE_ORDERS[b].total);
                break;
        }
        return sorted;
    }, [tab, query, sort, orderNos]);

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

    function runAction(label: string) {
        // TODO: wire up real order actions (payment, tracking, receipt confirmation, reorder) against the backend API.
        showToast("success", `"${label}" isn't wired up yet in this preview.`);
    }

    return (
        <div>
            <PageHeading action={<span className="font-mono text-[11px] text-grey">{filtered.length} Orders</span>}>
                My Purchase
            </PageHeading>

            <div className="mb-6 flex flex-wrap gap-x-7 gap-y-2 border-b border-ink/10 font-mono text-[11px] uppercase tracking-[.1em]">
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

            <div className="mb-8 flex flex-wrap items-center gap-2.5">
                <SearchField value={query} onChange={search} placeholder="Search by Order ID or Product name" />
                <select value={sort} onChange={(e) => sortBy(e.target.value as SortKey)} className={FILTER_SELECT}>
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                    <option value="total-desc">Total (High–Low)</option>
                    <option value="total-asc">Total (Low–High)</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 border border-ink/10 py-16 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-off text-grey">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="4" y="4" width="16" height="17" rx="1.5" />
                            <path d="M8 9h8M8 13h8M8 17h5" />
                        </svg>
                    </span>
                    <p className="max-w-[280px] text-[13px] leading-relaxed text-grey">
                        {query ? "No orders match your search." : "No orders in this status."}
                    </p>
                    <Link
                        href="/shop"
                        className="border border-ink/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                    >
                        Browse the Catalogue
                    </Link>
                </div>
            ) : (
                <>
                    <div className={HEADER_GRID}>
                        <span>Product</span>
                        <span className="text-right">Unit Price</span>
                        <span className="text-center">Quantity</span>
                        <span className="text-right">Total Price</span>
                        <span className="text-right">Actions</span>
                    </div>

                    <div className="flex flex-col divide-y divide-ink/10 border-b border-ink/10">
                        {paged.map((no) => {
                            const o = SAMPLE_ORDERS[no];
                            const p = getProduct(o.productId);
                            const unitPrice = o.total / o.qty;
                            const primary = PRIMARY_ACTION[o.status];

                            return (
                                <div
                                    key={no}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedOrderNo(no)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") setSelectedOrderNo(no);
                                    }}
                                    className="-mx-3 cursor-pointer px-3 py-4 transition hover:bg-off/50"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-4">
                                        <span className="font-mono text-[11px] text-grey">
                                            Order {no} <span className="text-ink/20">·</span> {formatDate(o.date)}
                                        </span>
                                        <span className="font-mono text-[11px] uppercase text-pink-dark">{o.status}</span>
                                    </div>

                                    <div className={ROW_GRID}>
                                        <div className="flex min-w-0 items-center gap-4">
                                            {p && (
                                                <div className="relative h-16 w-16 flex-none overflow-hidden border border-ink/10">
                                                    <Image src={p.image} alt={o.product} fill sizes="64px" className="object-cover" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="truncate text-[13.5px] text-ink">{o.product}</div>
                                                {p && (
                                                    <div className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">{p.category}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:block sm:text-right">
                                            <span className="font-mono text-[11px] uppercase text-grey sm:hidden">Unit Price</span>
                                            <span className="font-mono text-[13px] text-ink">₱{unitPrice.toLocaleString()}</span>
                                        </div>

                                        <div className="flex items-center justify-between sm:block sm:text-center">
                                            <span className="font-mono text-[11px] uppercase text-grey sm:hidden">Quantity</span>
                                            <span className="text-[13px] text-ink">{o.qty}</span>
                                        </div>

                                        <div className="flex items-center justify-between sm:block sm:text-right">
                                            <span className="font-mono text-[11px] uppercase text-grey sm:hidden">Total Price</span>
                                            <span className="font-mono text-[13px] font-semibold text-ink">₱{o.total.toLocaleString()}</span>
                                        </div>

                                        <div className="flex sm:justify-end">
                                            {primary && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        runAction(primary);
                                                    }}
                                                    className="bg-pink-btn px-4 py-2 text-[11.5px] font-semibold text-white transition hover:bg-pink-btn-hover"
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

            <Modal open={selectedOrderNo !== null} onClose={() => setSelectedOrderNo(null)} maxWidth="max-w-[480px]">
                {selectedOrderNo && (() => {
                    const o = SAMPLE_ORDERS[selectedOrderNo];
                    const p = getProduct(o.productId);
                    const unitPrice = o.total / o.qty;
                    return (
                        <div className="p-8">
                            <div className="mb-1 flex items-center justify-between gap-4 pr-6">
                                <h3 className="text-xl font-medium text-ink">Order {selectedOrderNo}</h3>
                                <span className="font-mono text-[11px] uppercase text-pink-dark">{o.status}</span>
                            </div>
                            <p className="mb-6 font-mono text-[11px] text-grey">{formatDate(o.date)}</p>

                            <div className="mb-6 flex items-center gap-4 border-b border-ink/10 pb-6">
                                {p && (
                                    <div className="relative h-16 w-16 flex-none overflow-hidden border border-ink/10">
                                        <Image src={p.image} alt={o.product} fill sizes="64px" className="object-cover" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[14px] text-ink">{o.product}</div>
                                    {p && <div className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">{p.category}</div>}
                                    <div className="mt-1 font-mono text-[12.5px] text-grey">
                                        ₱{unitPrice.toLocaleString()} × {o.qty}
                                    </div>
                                </div>
                                <span className="font-mono text-[15px] font-semibold text-ink">₱{o.total.toLocaleString()}</span>
                            </div>

                            <OrderTracker order={o} />
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
