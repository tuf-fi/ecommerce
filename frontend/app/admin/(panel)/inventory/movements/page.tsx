"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdminStore } from "@/library/adminStore";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import Pagination from "@/components/ui/Pagination";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const PAGE_SIZE = 20;

export default function StockMovementsPage() {
    const { stockLog } = useAdminStore();
    const mounted = useMounted();
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(stockLog.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = useMemo(
        () => stockLog.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [stockLog, currentPage]
    );
    useScrollTopOnChange(currentPage);

    if (!mounted) return <StockMovementsSkeleton />;

    return (
        <div>
            <div className="mb-6">
                <Link href="/admin/inventory" className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Inventory
                </Link>
            </div>

            <div className="border border-ink/10 bg-white">
                <div className="flex flex-col gap-1 border-b border-ink/10 px-4 py-4.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Stock Movement Log</h3>
                    <span className="font-mono text-[11px] text-grey">Audit trail — every change is recorded</span>
                </div>
                {stockLog.length === 0 ? (
                    <div className="p-11 text-center text-[13px] text-grey">No changes recorded yet.</div>
                ) : (
                    <div>
                        {paged.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex flex-col gap-1.5 border-b border-ink/10 px-4 py-3 text-[12.5px] last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:px-6"
                            >
                                <span className="break-words">
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
                                <span className="flex-none text-left sm:text-right">
                                    <span className="block font-mono text-[11px] text-grey">{entry.time}</span>
                                    <span className="block font-mono text-[10px] text-grey/70">{entry.actor}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
    );
}

// Mirrors the populated stock movement log — back link, card header, a run
// of log-entry rows, and pagination.
function StockMovementsSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6">
                <Skeleton className="h-[12.5px] w-36" />
            </div>

            <div className="border border-ink/10 bg-white">
                <div className="flex flex-col gap-1 border-b border-ink/10 px-4 py-4.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <Skeleton className="h-[15px] w-40" />
                    <Skeleton tone="soft" className="h-[11px] w-52" />
                </div>
                <div>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-1.5 border-b border-ink/10 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:px-6"
                        >
                            <Skeleton className="h-[12.5px] w-64" />
                            <div className="flex-none">
                                <Skeleton tone="soft" className="h-[11px] w-24" />
                                <Skeleton tone="faint" className="mt-1 h-[10px] w-16" />
                            </div>
                        </div>
                    ))}
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
