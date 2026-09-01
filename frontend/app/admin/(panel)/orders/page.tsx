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
import { FILTER_SELECT } from "@/components/admin/formClasses";

type SortKey = "date-desc" | "date-asc" | "total-desc" | "total-asc";

const PAGE_SIZE = 10;

const TONE_DOT_CLASSES: Record<string, string> = {
    success: "bg-success",
    warning: "bg-pink-dark",
    alert: "bg-alert",
    neutral: "bg-ink/30",
};

export default function OrdersPage() {
    const { orders, updateOrderStatus } = useAdminStore();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<AdminOrderStatus | "All">("All");
    const [sort, setSort] = useState<SortKey>("date-desc");
    const [page, setPage] = useState(1);
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
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    useScrollTopOnChange(currentPage);

    const modalOrder = activeOrder ? (orders.find((o) => o.no === activeOrder.no) ?? null) : null;

    return (
        <div>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {ORDER_STATUSES.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
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

            <div className="mb-6 flex flex-wrap items-center gap-2.5">
                <SearchField value={search} onChange={setSearch} placeholder="Search by order # or customer" />
                <select value={status} onChange={(e) => setStatus(e.target.value as AdminOrderStatus | "All")} className={FILTER_SELECT}>
                    <option value="All">Status: All</option>
                    {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            Status: {s}
                        </option>
                    ))}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={FILTER_SELECT}>
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                    <option value="total-desc">Total (High–Low)</option>
                    <option value="total-asc">Total (Low–High)</option>
                </select>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                            <tr className="bg-off/50">
                                {["Order", "Customer", "Date", "Items", "Total", "Status"].map((h) => (
                                    <th key={h} className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center text-[13px] text-grey">
                                        No orders match this search.
                                    </td>
                                </tr>
                            )}
                            {paged.map((o) => (
                                <tr key={o.no} onClick={() => setActiveOrder(o)} className="cursor-pointer transition hover:bg-off/40">
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

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <OrderModal open={modalOrder !== null} order={modalOrder} onClose={() => setActiveOrder(null)} onStatusChange={updateOrderStatus} />
        </div>
    );
}
