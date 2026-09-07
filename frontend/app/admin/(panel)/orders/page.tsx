"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminStore } from "@/library/adminStore";
import { orderItemCount, orderTotal } from "@/library/admin/orders";
import { AdminOrder, AdminOrderStatus } from "@/library/admin/types";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import SearchField from "@/components/admin/SearchField";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { ORDER_STATUS_TONE, ORDER_STATUSES } from "@/components/admin/orderStatus";
import OrderModal from "@/components/admin/modals/OrderModal";
import BulkActionBar from "@/components/admin/BulkActionBar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FILTER_SELECT } from "@/components/admin/formClasses";
import { toCsv, downloadCsv } from "@/library/admin/csv";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

type SortKey = "date-desc" | "date-asc" | "total-desc" | "total-asc";

const PAGE_SIZE = 10;

const TONE_DOT_CLASSES: Record<string, string> = {
    success: "bg-success",
    warning: "bg-pink-dark",
    alert: "bg-alert",
    neutral: "bg-ink/30",
};

export default function OrdersPage() {
    const { orders, updateOrderStatus, bulkUpdateOrderStatus } = useAdminStore();
    const mounted = useMounted();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<AdminOrderStatus | "All">("All");
    const [sort, setSort] = useState<SortKey>("date-desc");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState<AdminOrderStatus>(ORDER_STATUSES[0]);
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    // Lazy initializer instead of an effect: resolves the ?order= deep link
    // (from a notification click) once, at the navigation that mounts this page.
    const [activeOrder, setActiveOrder] = useState<AdminOrder | null>(() => {
        const ref = searchParams.get("order");
        return ref ? (orders.find((o) => o.no === ref) ?? null) : null;
    });

    const statusCounts = useMemo(() => {
        const counts = {} as Record<AdminOrderStatus, number>;
        for (const s of ORDER_STATUSES) counts[s] = orders.filter((o) => o.status === s).length;
        return counts;
    }, [orders]);

    const filtered = useMemo(() => {
        let list = orders;
        if (status !== "All") list = list.filter((o) => o.status === status);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((o) => o.no.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q));
        }
        const sorted = [...list];
        switch (sort) {
            case "date-desc":
                sorted.sort((a, b) => b.date.localeCompare(a.date));
                break;
            case "date-asc":
                sorted.sort((a, b) => a.date.localeCompare(b.date));
                break;
            case "total-desc":
                sorted.sort((a, b) => orderTotal(b) - orderTotal(a));
                break;
            case "total-asc":
                sorted.sort((a, b) => orderTotal(a) - orderTotal(b));
                break;
        }
        return sorted;
    }, [orders, status, search, sort]);

    // Reset to page 1 whenever the filter set changes — a render-time state
    // adjustment rather than an effect (see InventoryPage for the pattern).
    const filterKey = `${status}|${search}|${sort}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
        if (selected.size > 0) setSelected(new Set());
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    useScrollTopOnChange(currentPage);

    const modalOrder = activeOrder ? (orders.find((o) => o.no === activeOrder.no) ?? null) : null;

    const allOnPageSelected = paged.length > 0 && paged.every((o) => selected.has(o.no));
    function toggleRow(no: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(no)) next.delete(no);
            else next.add(no);
            return next;
        });
    }
    function toggleAllOnPage() {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allOnPageSelected) paged.forEach((o) => next.delete(o.no));
            else paged.forEach((o) => next.add(o.no));
            return next;
        });
    }
    function clearSelection() {
        setSelected(new Set());
    }

    function applyBulkStatus() {
        if (bulkStatus === "Cancelled") {
            setBulkConfirmOpen(true);
            return;
        }
        bulkUpdateOrderStatus(Array.from(selected), bulkStatus);
        clearSelection();
    }

    function exportSelected() {
        const rows = orders.filter((o) => selected.has(o.no));
        const csv = toCsv(rows, [
            { header: "Order", value: (o) => o.no },
            { header: "Customer", value: (o) => o.customer },
            { header: "Date", value: (o) => o.date },
            { header: "Items", value: (o) => orderItemCount(o) },
            { header: "Total", value: (o) => orderTotal(o) },
            { header: "Status", value: (o) => o.status },
        ]);
        downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    }

    if (!mounted) return <OrdersSkeleton />;

    return (
        <div>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {ORDER_STATUSES.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatus((current) => (current === s ? "All" : s))}
                        className={`border bg-white px-4 py-4 text-left transition ${
                            status === s ? "border-pink-dark" : "border-ink/10 hover:border-ink/25"
                        }`}
                    >
                        <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] tracking-[.1em] text-grey uppercase">
                            <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT_CLASSES[ORDER_STATUS_TONE[s]]}`} />
                            {s}
                        </div>
                        <div className="font-display text-[22px] font-medium text-ink">{statusCounts[s]}</div>
                    </button>
                ))}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <SearchField value={search} onChange={setSearch} placeholder="Search by order # or customer" />
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={FILTER_SELECT}>
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                    <option value="total-desc">Total (High–Low)</option>
                    <option value="total-asc">Total (Low–High)</option>
                </select>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                    <thead>
                            <tr className="bg-off/50">
                                <th scope="col" className="w-11 border-b border-ink/10 px-5 py-3.5">
                                    <input
                                        type="checkbox"
                                        checked={allOnPageSelected}
                                        onChange={toggleAllOnPage}
                                        aria-label="Select all orders on this page"
                                        className="h-4 w-4 accent-pink-btn"
                                    />
                                </th>
                                {["Order", "Customer", "Date", "Items", "Total", "Status"].map((h) => (
                                    <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-[13px] text-grey">
                                        No orders match this search.
                                    </td>
                                </tr>
                            )}
                            {paged.map((o) => (
                                <tr
                                    key={o.no}
                                    onClick={() => setActiveOrder(o)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`View order ${o.no}`}
                                    onKeyDown={(e) => {
                                        if ((e.key === "Enter" || e.key === " ") && !(e.target instanceof HTMLInputElement)) {
                                            e.preventDefault();
                                            setActiveOrder(o);
                                        }
                                    }}
                                    className="cursor-pointer transition hover:bg-off/40"
                                >
                                    <td className="border-b border-ink/10 px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selected.has(o.no)}
                                            onChange={() => toggleRow(o.no)}
                                            aria-label={`Select order ${o.no}`}
                                            className="h-4 w-4 accent-pink-btn"
                                        />
                                    </td>
                                    <td className="border-b border-ink/10 px-5 py-3.5 text-[13px] font-medium text-ink">{o.no}</td>
                                    <td className="border-b border-ink/10 px-5 py-3.5 text-[13px] text-ink">{o.customer}</td>
                                    <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12px] text-grey">{o.date}</td>
                                    <td className="border-b border-ink/10 px-5 py-3.5 text-[13px] text-ink">{orderItemCount(o)}</td>
                                    <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12.5px] text-ink">₱{orderTotal(o).toLocaleString()}</td>
                                    <td className="border-b border-ink/10 px-5 py-3.5">
                                        <StatusBadge label={o.status} tone={ORDER_STATUS_TONE[o.status]} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
              </div>
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <BulkActionBar count={selected.size} onClear={clearSelection}>
                <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as AdminOrderStatus)}
                    aria-label="Bulk status to apply"
                    className="h-9 rounded-none border border-white/25 bg-navy px-3 text-[12px] text-white outline-none transition focus:border-white/60 focus-visible:ring-2 focus-visible:ring-white/60"
                >
                    {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            Mark as {s}
                        </option>
                    ))}
                </select>
                <button
                    onClick={applyBulkStatus}
                    className="flex h-9 items-center bg-pink-btn px-4 text-[12px] font-semibold text-white transition hover:bg-pink-btn-hover"
                >
                    Apply
                </button>
                <button
                    onClick={exportSelected}
                    className="flex h-9 items-center border border-white/25 px-3.5 text-[12px] font-semibold text-white transition hover:border-white hover:bg-white/10"
                >
                    Export CSV
                </button>
            </BulkActionBar>

            <OrderModal open={modalOrder !== null} order={modalOrder} onClose={() => setActiveOrder(null)} onStatusChange={updateOrderStatus} />

            <ConfirmModal
                open={bulkConfirmOpen}
                title="Cancel these orders?"
                description={`${selected.size} order${selected.size === 1 ? "" : "s"} will be marked as Cancelled. This is visible to the affected customers.`}
                onConfirm={() => {
                    bulkUpdateOrderStatus(Array.from(selected), "Cancelled");
                    clearSelection();
                }}
                onClose={() => setBulkConfirmOpen(false)}
            />
        </div>
    );
}

// Mirrors the populated orders page — 5 status-count filter cards, the
// search/sort toolbar, and the order table with pagination.
function OrdersSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border border-ink/10 bg-white px-4 py-4">
                        <div className="mb-1.5 flex items-center gap-1.5">
                            <Skeleton tone="soft" className="h-1.5 w-1.5 rounded-full" />
                            <Skeleton tone="soft" className="h-[10px] w-14" />
                        </div>
                        <Skeleton className="h-[22px] w-8" />
                    </div>
                ))}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <Skeleton tone="outline" className="h-11 w-64" />
                <Skeleton tone="outline" className="h-11 w-48" />
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <div className="border-b border-ink/10 bg-off/50 px-5 py-3.5">
                    <Skeleton tone="soft" className="h-[10px] w-full" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-6 border-b border-ink/10 px-5 py-3.5 last:border-b-0">
                        <Skeleton tone="outline" className="h-4 w-4 flex-none" />
                        <Skeleton className="h-[13px] w-16" />
                        <Skeleton className="h-[13px] w-28" />
                        <Skeleton tone="soft" className="h-3 w-16" />
                        <Skeleton className="h-[13px] w-6" />
                        <Skeleton className="h-3 w-14" />
                        <Skeleton tone="outline" className="h-[19px] w-20 rounded-pill" />
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center gap-1.5">
                <Skeleton tone="outline" className="h-8 w-20" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-16" />
            </div>
        </SkeletonGroup>
    );
}
