"use client";

import { useMemo, useState } from "react";
import { useAdminStore } from "@/library/adminStore";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import Pagination from "@/components/ui/Pagination";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import { FILTER_SELECT } from "@/components/admin/formClasses";
import { Toolbar, ToolbarFilters, FilterField } from "@/components/admin/Toolbar";
import StatusBadge, { BadgeTone } from "@/components/admin/StatusBadge";
import { EmptyStateBlock } from "@/components/admin/EmptyState";

const PAGE_SIZE = 20;

type SortOrder = "date-desc" | "date-asc";
type TypeFilter = "all" | "in" | "out" | "adj";

// Reuses StatusBadge's TONE_CLASSES so a future palette change propagates here too.
const LEGEND: { type: "in" | "out" | "adj"; tone: BadgeTone; label: string }[] = [
    { type: "in", tone: "success", label: "added" },
    { type: "out", tone: "alert", label: "removed" },
    { type: "adj", tone: "neutral", label: "adjusted" },
];

export default function StockMovementsPage() {
    const { stockLog } = useAdminStore();
    const mounted = useMounted();
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<SortOrder>("date-desc");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

    const filtered = useMemo(
        () => (typeFilter === "all" ? stockLog : stockLog.filter((e) => e.type === typeFilter)),
        [stockLog, typeFilter]
    );
    // Newest-first is the log's native order; "Oldest" just reads it backwards.
    const sorted = useMemo(() => (sort === "date-asc" ? [...filtered].reverse() : filtered), [filtered, sort]);

    // Reset to page 1 on filter change; a render-time state adjustment, not an effect (see InventoryPage).
    const filterKey = `${sort}|${typeFilter}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = useMemo(
        () => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [sorted, currentPage]
    );
    useScrollTopOnChange(currentPage);

    if (!mounted) return <StockMovementsSkeleton />;

    return (
        <div>
            <Toolbar
                filters={
                    <ToolbarFilters>
                        <FilterField label="Type" className="w-full flex-none sm:w-36">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                                aria-label="Filter log by type"
                                className={`${FILTER_SELECT} w-full`}
                            >
                                <option value="all">All types</option>
                                <option value="in">In</option>
                                <option value="out">Out</option>
                                <option value="adj">Adjusted</option>
                            </select>
                        </FilterField>
                        <FilterField label="Sort by" className="w-full flex-none sm:w-44">
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortOrder)}
                                aria-label="Sort log by date"
                                className={`${FILTER_SELECT} w-full`}
                            >
                                <option value="date-desc">Date (Newest)</option>
                                <option value="date-asc">Date (Oldest)</option>
                            </select>
                        </FilterField>
                        <FilterField label="Legend" className="ml-auto flex-none">
                            <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1.5">
                                {LEGEND.map((item) => (
                                    <span key={item.type} className="flex items-center gap-1.5 text-[11.5px] text-grey">
                                        <StatusBadge label={item.type.toUpperCase()} tone={item.tone} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </FilterField>
                    </ToolbarFilters>
                }
            />

            <div className="border border-ink/10 bg-white shadow-card">
                {sorted.length === 0 ? (
                    <EmptyStateBlock
                        variant={stockLog.length === 0 ? "empty" : "filtered"}
                        message={stockLog.length === 0 ? "No changes recorded yet." : "No movements match this filter."}
                    />
                ) : (
                    <div>
                        {paged.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex flex-col gap-1.5 border-b border-ink/10 px-4 py-3 text-[12.5px] last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:px-6"
                            >
                                <span className="break-words">
                                    <span className="mr-2 inline-block align-middle">
                                        <StatusBadge
                                            label={entry.type.toUpperCase()}
                                            tone={LEGEND.find((l) => l.type === entry.type)?.tone ?? "neutral"}
                                        />
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
                <div className="border-t border-ink/10 bg-off/50 px-5 py-2.5 text-right font-mono text-[11px] text-grey">
                    Showing {sorted.length} of {stockLog.length}
                </div>
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
    );
}

function StockMovementsSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-ink/10 pb-6">
                <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton tone="soft" className="h-[10px] w-14" />
                    <div className="flex h-11 items-center gap-4">
                        <Skeleton tone="soft" className="h-[19px] w-16" />
                        <Skeleton tone="soft" className="h-[19px] w-20" />
                        <Skeleton tone="soft" className="h-[19px] w-20" />
                    </div>
                </div>
                <div className="flex flex-none flex-wrap items-end gap-4">
                    <Skeleton tone="outline" className="h-11 w-36" />
                    <Skeleton tone="outline" className="h-11 w-44" />
                </div>
            </div>

            <div className="border border-ink/10 bg-white shadow-card">
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
