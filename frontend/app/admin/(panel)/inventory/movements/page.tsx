"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdminStore } from "@/library/adminStore";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 20;

export default function StockMovementsPage() {
    const { stockLog } = useAdminStore();
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(stockLog.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = useMemo(
        () => stockLog.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [stockLog, currentPage]
    );
    useScrollTopOnChange(currentPage);

    return (
        <div>
            <div className="mb-6">
                <Link href="/admin/inventory" className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Inventory
                </Link>
            </div>

            <div className="border border-ink/10 bg-white">
                <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Stock Movement Log</h3>
                    <span className="font-mono text-[11px] text-grey">Audit trail — every change is recorded</span>
                </div>
                {stockLog.length === 0 ? (
                    <div className="p-11 text-center text-[13px] text-grey">No changes recorded yet.</div>
                ) : (
                    <div>
                        {paged.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between gap-2.5 border-b border-ink/10 px-6 py-3 text-[12.5px] last:border-b-0">
                                <span>
                                    <span
                                        className={`mr-2 rounded-pill px-2 py-0.5 font-mono text-[10px] uppercase ${
                                            entry.type === "in"
                                                ? "bg-success/10 text-success-dark"
                                                : entry.type === "out"
                                                  ? "bg-alert/10 text-alert"
                                                  : "bg-blue-soft text-ink"
                                        }`}
                                    >
                                        {entry.type}
                                    </span>
                                    {entry.text}
                                </span>
                                <span className="flex-none font-mono text-[11px] text-grey">{entry.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
    );
}
