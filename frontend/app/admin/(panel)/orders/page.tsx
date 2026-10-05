"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useAdminStore } from "@/library/adminStore";
import { orderItemCount, orderTotal } from "@/library/admin/orders";
import { AdminOrder, AdminOrderStatus } from "@/library/admin/types";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import SearchField from "@/components/admin/SearchField";
import { Toolbar, ToolbarFilters, FilterField } from "@/components/admin/Toolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { ORDER_STATUS_TONE, ORDER_STATUSES } from "@/components/admin/orderStatus";
import OrderModal from "@/components/admin/modals/OrderModal";
import BulkActionBar from "@/components/admin/BulkActionBar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FILTER_SELECT, BTN_BULK_PRIMARY, BTN_BULK_SECONDARY, BTN_SECONDARY } from "@/components/admin/formClasses";
import { ImportIcon, ExportIcon } from "@/components/admin/icons";
import { downloadOrdersCsv } from "@/library/api/orders";
import { toCsv, downloadCsv } from "@/library/admin/csv";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import ListPanel from "@/components/admin/ListPanel";
import { EmptyStateRow } from "@/components/admin/EmptyState";
import StatTile, { STAT_TONE_CLASSES, STAT_TONE_SHADOW, StatTileTone } from "@/components/admin/StatTile";

type SortKey = "date-desc" | "date-asc" | "total-desc" | "total-asc";

const PAGE_SIZE = 10;

// Separate from ORDER_STATUS_TONE: tiles need each status visually distinct, unlike the table's grouped tones.
const STAT_STATUS_TONE: Record<AdminOrderStatus, StatTileTone> = {
    Pending: "warning",
    Paid: "blue",
    Shipped: "neutral",
    Delivered: "success",
    Cancelled: "alert",
};

export default function OrdersPage() {
    const { orders, updateOrderStatus, bulkUpdateOrderStatus, importOrders, reviewPayment } = useAdminStore();
    const importInputRef = useRef<HTMLInputElement>(null);
    const mounted = useMounted();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<AdminOrderStatus | "All">("All");
    const [sort, setSort] = useState<SortKey>("date-desc");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState<AdminOrderStatus>(ORDER_STATUSES[0]);
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    // Lazy initializer, not an effect: resolves the ?order= deep link once, at mount.
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

    // Reset to page 1 on filter change; a render-time state adjustment, not an effect (see InventoryPage).
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

    async function exportAll() {
        try {
            await downloadOrdersCsv(status);
        } catch {
            toast.error("Couldn't export the orders. Please try again.");
        }
    }

    async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const result = await importOrders(file);
        if (!result) return;
        if (result.updated > 0) toast.success(`${result.updated} order${result.updated === 1 ? "" : "s"} updated.`);
        if (result.skipped.length > 0) {
            console.warn("Order import — skipped rows:", result.skipped);
            toast.error(`${result.skipped.length} row${result.skipped.length === 1 ? "" : "s"} skipped: ${result.skipped[0]}${result.skipped.length > 1 ? " (see the console for the rest)" : ""}`);
        } else if (result.updated === 0) {
            toast.error("No changes were made.");
        }
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
            {/* Solid fill carries the status color (like Dashboard's StatCard); active filter gets an inset ring, not just a border. */}
            <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
                {ORDER_STATUSES.map((s) => (
                    <StatTile
                        key={s}
                        label={s}
                        count={statusCounts[s]}
                        tone={STAT_STATUS_TONE[s]}
                        active={status === s}
                        onClick={() => setStatus((current) => (current === s ? "All" : s))}
                    />
                ))}
            </div>

            <Toolbar
                actions={
                    <>
                        <input ref={importInputRef} type="file" accept=".csv,text/csv" onChange={handleImportFile} className="hidden" aria-label="Import order statuses from CSV" />
                        <button onClick={() => importInputRef.current?.click()} className={BTN_SECONDARY} title="Update many orders' status from a CSV with Order and Status columns">
                            <ImportIcon />
                            Import
                        </button>
                        <button onClick={exportAll} className={BTN_SECONDARY} title={status === "All" ? "Download every order" : `Download every ${status.toLowerCase()} order`}>
                            <ExportIcon />
                            Export
                        </button>
                    </>
                }
                filters={
                    <ToolbarFilters>
                        <FilterField label="Search" className="min-w-[240px] flex-1">
                            <SearchField value={search} onChange={setSearch} placeholder="Search by order # or customer" className="w-full" />
                        </FilterField>
                        <FilterField label="Status" className="w-full flex-none sm:w-[160px]">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as AdminOrderStatus | "All")}
                                className={`${FILTER_SELECT} w-full`}
                            >
                                <option value="All">All statuses</option>
                                {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </FilterField>
                        <FilterField label="Sort by" className="w-full flex-none sm:w-[190px]">
                            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${FILTER_SELECT} w-full`}>
                                <option value="date-desc">Date (Newest)</option>
                                <option value="date-asc">Date (Oldest)</option>
                                <option value="total-desc">Total (High–Low)</option>
                                <option value="total-asc">Total (Low–High)</option>
                            </select>
                        </FilterField>
                    </ToolbarFilters>
                }
            />

            <ListPanel minWidth={720} footer={<>Showing {filtered.length} of {orders.length}</>}>
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
                                    <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 && (
                                <EmptyStateRow colSpan={7} variant="filtered" message="No orders match this search." />
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
                                        {o.status === "Pending" && o.payment?.state === "review" && (
                                            <span className="mt-1 block font-mono text-[10px] tracking-[.1em] text-pink-dark uppercase">Payment to review</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
            </ListPanel>

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
                <button onClick={applyBulkStatus} className={BTN_BULK_PRIMARY}>
                    Apply
                </button>
                <button onClick={exportSelected} className={BTN_BULK_SECONDARY}>
                    Export CSV
                </button>
            </BulkActionBar>

            <OrderModal open={modalOrder !== null} order={modalOrder} onClose={() => setActiveOrder(null)} onStatusChange={updateOrderStatus} onReviewPayment={reviewPayment} />

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

function OrdersSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
                {ORDER_STATUSES.map((s) => {
                    const toneKey: StatTileTone = STAT_STATUS_TONE[s];
                    return (
                        <div key={s} className={`px-4 py-5 ${STAT_TONE_CLASSES[toneKey]} ${STAT_TONE_SHADOW[toneKey]}`}>
                            <Skeleton tone="onSolid" className="mb-2 h-[10px] w-14" />
                            <Skeleton tone="onSolid" className="h-[26px] w-8" />
                        </div>
                    );
                })}
            </div>

            <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-ink/10 pb-6">
                <div className="flex flex-1 flex-wrap items-end gap-4">
                    <Skeleton tone="outline" className="h-11 flex-1 min-w-[240px]" />
                    <Skeleton tone="outline" className="h-11 w-[160px]" />
                    <Skeleton tone="outline" className="h-11 w-[190px]" />
                </div>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white shadow-card">
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
                <div className="border-t border-ink/10 bg-off/50 px-5 py-2.5 text-right">
                    <Skeleton tone="soft" className="ml-auto h-[11px] w-28" />
                </div>
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
