"use client";

import { SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { FILTER_SELECT, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import { FilterField, Toolbar, ToolbarFilters } from "@/components/admin/Toolbar";
import SearchField from "@/components/admin/SearchField";
import ListPanel from "@/components/admin/ListPanel";
import { ContactMessageRow, listContactMessages, Paged } from "@/library/api/adminData";
import { ApiError } from "@/library/api/client";

export default function ContactMessagesPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [days, setDays] = useState(0);
    const [sort, setSort] = useState<"newest" | "oldest">("newest");
    const [result, setResult] = useState<Paged<ContactMessageRow> | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let stale = false;
        const t = setTimeout(() => {
            listContactMessages({ page, search: search.trim() || undefined, days: days || undefined, sort })
                .then((r) => {
                    if (stale) return;
                    setResult(r);
                    setError("");
                })
                .catch((err) => !stale && setError(err instanceof ApiError ? err.message : "Could not load messages."));
        }, 250);
        return () => {
            stale = true;
            clearTimeout(t);
        };
    }, [page, search, days, sort]);

    const filtered = search.trim() !== "" || days !== 0;

    return (
        <div>
            <p className="mb-5 max-w-[560px] text-meta leading-relaxed text-grey">Messages sent from the Contact form, newest first. Reply to the sender by email.</p>
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
                                placeholder="Search by name, email or message"
                                className="w-full"
                            />
                        </FilterField>
                        <FilterField label="Received" className="w-full flex-none sm:w-[160px]">
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
                <SkeletonTable rows={6} cols={4} />
            ) : result.items.length === 0 ? (
                <EmptyState title={filtered ? "No matches" : "No messages yet"} message={filtered ? "No messages match those filters." : "Messages sent from the Contact form will show up here."} />
            ) : (
                <>
                    <ListPanel minWidth={760} footer={<>Showing {result.items.length} of {result.total.toLocaleString()}</>}>
                        <thead>
                            <tr className={TABLE_HEAD_ROW}>
                                {["From", "Email", "Message", "Date"].map((h) => (
                                    <th key={h} scope="col" className={TABLE_TH}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {result.items.map((m) => (
                                <tr key={m.id} className="align-top">
                                    <td className={`${TABLE_TD} text-small font-medium whitespace-nowrap text-ink`}>{m.name}</td>
                                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                                        <a href={`mailto:${m.email}`} className="text-small text-blue-accent underline underline-offset-2 hover:text-blue-accent-hover">{m.email}</a>
                                    </td>
                                    <td className={`${TABLE_TD} max-w-[360px] text-small leading-relaxed whitespace-pre-wrap text-grey`}>{m.message}</td>
                                    <td className={`${TABLE_TD} whitespace-nowrap font-mono text-meta text-grey`}>
                                        <time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>
                                    </td>
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
