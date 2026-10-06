"use client";

import { useEffect, useState } from "react";
import Pager from "@/components/admin/settings/Pager";
import { FIELD_INPUT, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import ListPanel from "@/components/admin/ListPanel";
import { ContactMessageRow, listContactMessages, Paged } from "@/library/api/adminData";
import { ApiError } from "@/library/api/client";

export default function ContactMessagesPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [result, setResult] = useState<Paged<ContactMessageRow> | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let stale = false;
        const t = setTimeout(() => {
            listContactMessages({ page, search: search.trim() || undefined })
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
    }, [page, search]);

    return (
        <div>
            <p className="mb-5 max-w-[560px] text-[12.5px] leading-relaxed text-grey">Messages sent from the Contact form, newest first. Reply to the sender by email.</p>
            <input
                aria-label="Search messages"
                value={search}
                onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                }}
                placeholder="Search by name or email"
                className={`${FIELD_INPUT} mb-5 max-w-[280px]`}
            />

            {error ? (
                <p className="text-[13px] text-alert">{error}</p>
            ) : !result ? (
                <p className="text-[13px] text-grey">Loading…</p>
            ) : result.items.length === 0 ? (
                <p className="text-[13px] text-grey">{search ? "No messages match that." : "No messages yet."}</p>
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
                                    <td className={`${TABLE_TD} text-[13px] font-medium whitespace-nowrap text-ink`}>{m.name}</td>
                                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                                        <a href={`mailto:${m.email}`} className="text-[13px] text-blue-accent underline underline-offset-2 hover:text-blue-accent-hover">{m.email}</a>
                                    </td>
                                    <td className={`${TABLE_TD} max-w-[360px] text-[13px] leading-relaxed whitespace-pre-wrap text-grey`}>{m.message}</td>
                                    <td className={`${TABLE_TD} whitespace-nowrap font-mono text-[12px] text-grey`}>
                                        <time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>
                                    </td>
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
