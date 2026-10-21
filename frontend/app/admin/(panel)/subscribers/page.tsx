"use client";

import { SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { FILTER_SELECT, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import { FilterField, Toolbar, ToolbarFilters } from "@/components/admin/Toolbar";
import SearchField from "@/components/admin/SearchField";
import ListPanel from "@/components/admin/ListPanel";
import { listSubscribers, Paged, SubscriberRow } from "@/library/api/adminData";
import { ApiError } from "@/library/api/client";

export default function SubscribersPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [source, setSource] = useState<"" | "newsletter" | "promo">("");
    const [days, setDays] = useState(0);
    const [sort, setSort] = useState<"newest" | "oldest">("newest");
    const [result, setResult] = useState<Paged<SubscriberRow> | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let stale = false;
        // A short pause after typing, so each keystroke isn't its own request.
        const t = setTimeout(() => {
            listSubscribers({ page, search: search.trim() || undefined, source: source || undefined, days: days || undefined, sort })
                .then((r) => {
                    if (stale) return;
                    setResult(r);
                    setError("");
                })
                .catch((err) => !stale && setError(err instanceof ApiError ? err.message : "Could not load subscribers."));
        }, 250);
        return () => {
            stale = true;
            clearTimeout(t);
        };
    }, [page, search, source, days, sort]);

    const filtered = search.trim() !== "" || source !== "" || days !== 0;

    return (
        <div>
            <p className="mb-5 max-w-[560px] text-meta leading-relaxed text-grey">People who signed up through the newsletter form or the welcome offer. Anyone who unsubscribes is removed automatically.</p>
            <Toolbar
                filters={
                    <ToolbarFilters>
                        <FilterField label="Search" className="min-w-[240px] flex-1">
                            <SearchField
                                value={search}
                                onChange={(v) => {
                                    setPage(1);
                                    setSearch(v);
                                }}
                                placeholder="Search by email"
                                className="w-full"
                            />
                        </FilterField>
                        <FilterField label="Signed up via" className="w-full flex-none sm:w-[180px]">
                            <select
                                value={source}
                                onChange={(e) => {
                                    setPage(1);
                                    setSource(e.target.value as typeof source);
                                }}
                                className={`${FILTER_SELECT} w-full`}
                            >
                                <option value="">All sources</option>
                                <option value="newsletter">Newsletter form</option>
                                <option value="promo">Welcome offer</option>
                            </select>
                        </FilterField>
                        <FilterField label="Signed up" className="w-full flex-none sm:w-[160px]">
                            <select
                                value={days}
                                onChange={(e) => {
                                    setPage(1);
                                    setDays(Number(e.target.value));
                                }}
                                className={`${FILTER_SELECT} w-full`}
                            >
                                <option value={0}>Any time</option>
                                <option value={7}>Last 7 days</option>
                                <option value={30}>Last 30 days</option>
                                <option value={90}>Last 90 days</option>
                            </select>
                        </FilterField>
                        <FilterField label="Sort by" className="w-full flex-none sm:w-[150px]">
                            <select
                                value={sort}
                                onChange={(e) => {
                                    setPage(1);
                                    setSort(e.target.value as typeof sort);
                                }}
                                className={`${FILTER_SELECT} w-full`}
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                            </select>
                        </FilterField>
                    </ToolbarFilters>
                }
            />

            {error ? (
                <p className="text-small text-alert">{error}</p>
            ) : !result ? (
                <SkeletonTable rows={6} cols={3} />
            ) : result.items.length === 0 ? (
                <EmptyState title={filtered ? "No matches" : "No subscribers yet"} message={filtered ? "No subscribers match those filters." : "People who sign up for the newsletter will show up here."} />
            ) : (
                <>
                    <ListPanel minWidth={520} footer={<>Showing {result.items.length} of {result.total.toLocaleString()}</>}>
                        <thead>
                            <tr className={TABLE_HEAD_ROW}>
                                {["Email", "Signed up via", "Date"].map((h) => (
                                    <th key={h} scope="col" className={TABLE_TH}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {result.items.map((s) => (
                                <tr key={s.id}>
                                    <td className={`${TABLE_TD} text-small text-ink`}>{s.email}</td>
                                    <td className={`${TABLE_TD} text-small text-ink`}>{s.source}</td>
                                    <td className={`${TABLE_TD} whitespace-nowrap font-mono text-meta text-grey`}>{new Date(s.createdAt).toLocaleDateString([], { dateStyle: "medium" })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </ListPanel>
                    <Pagination page={result.page} totalPages={Math.max(1, Math.ceil(result.total / result.pageSize))} onChange={setPage} />
                </>
            )}
        </div>
    );
}
