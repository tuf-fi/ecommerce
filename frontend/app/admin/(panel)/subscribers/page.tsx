"use client";

import { SkeletonTable } from "@/components/ui/Skeleton";
import { useEffect, useState } from "react";
import Pager from "@/components/admin/settings/Pager";
import { FIELD_INPUT, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import ListPanel from "@/components/admin/ListPanel";
import { listSubscribers, Paged, SubscriberRow } from "@/library/api/adminData";
import { ApiError } from "@/library/api/client";

export default function SubscribersPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [result, setResult] = useState<Paged<SubscriberRow> | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let stale = false;
        // A short pause after typing, so each keystroke isn't its own request.
        const t = setTimeout(() => {
            listSubscribers({ page, search: search.trim() || undefined })
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
    }, [page, search]);

    return (
        <div>
            <p className="mb-5 max-w-[560px] text-[12.5px] leading-relaxed text-grey">People who signed up through the newsletter form or the welcome offer. Anyone who unsubscribes is removed automatically.</p>
            <input
                aria-label="Search subscribers"
                value={search}
                onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                }}
                placeholder="Search by email"
                className={`${FIELD_INPUT} mb-5 max-w-[280px]`}
            />

            {error ? (
                <p className="text-[13px] text-alert">{error}</p>
            ) : !result ? (
                <SkeletonTable rows={6} cols={4} />
            ) : result.items.length === 0 ? (
                <p className="text-[13px] text-grey">{search ? "No subscribers match that." : "No subscribers yet."}</p>
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
                                    <td className={`${TABLE_TD} text-[13px] text-ink`}>{s.email}</td>
                                    <td className={`${TABLE_TD} text-[13px] text-ink`}>{s.source}</td>
                                    <td className={`${TABLE_TD} whitespace-nowrap font-mono text-[12px] text-grey`}>{new Date(s.createdAt).toLocaleDateString([], { dateStyle: "medium" })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </ListPanel>
                    <Pager page={result.page} pageSize={result.pageSize} total={result.total} onPage={setPage} />
                </>
            )}
        </div>
    );
}
