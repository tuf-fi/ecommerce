"use client";

import { useEffect, useState } from "react";
import Pager from "@/components/admin/settings/Pager";
import { FIELD_INPUT, FILTER_SELECT, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import ListPanel from "@/components/admin/ListPanel";
import StatusBadge, { BadgeTone } from "@/components/admin/StatusBadge";
import { AuditEntry, listAuditLog, Paged } from "@/library/api/adminData";
import { ApiError } from "@/library/api/client";

const ENTITY_TYPES = ["order", "product", "voucher", "staff", "content"];

const ACTION_TONE: Record<string, BadgeTone> = { create: "success", delete: "alert", refund: "warning" };

const titleCase = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, " ");
const dateOf = (iso: string) => new Date(iso).toLocaleDateString([], { dateStyle: "medium" });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { timeStyle: "short" });

function formatValue(v: unknown): string {
    if (v === null || v === undefined || v === "") return "—";
    if (Array.isArray(v)) return v.map(formatValue).join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
}

function Details({ details }: { details: AuditEntry["details"] }) {
    const pairs = details && typeof details === "object" ? Object.entries(details) : [];
    if (pairs.length === 0) return <span className="text-grey">—</span>;
    return (
        <dl className="flex max-w-[420px] flex-wrap gap-x-4 gap-y-1">
            {pairs.map(([k, v]) => (
                <div key={k} className="flex gap-1.5 text-[12px]">
                    <dt className="text-grey">{titleCase(k)}</dt>
                    <dd className="text-ink">{formatValue(v)}</dd>
                </div>
            ))}
        </dl>
    );
}

export default function AuditLogPage() {
    const [page, setPage] = useState(1);
    const [entityType, setEntityType] = useState("");
    const [entityId, setEntityId] = useState("");
    const [result, setResult] = useState<Paged<AuditEntry> | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let stale = false;
        listAuditLog({ page, entityType: entityType || undefined, entityId: entityId.trim() || undefined })
            .then((r) => {
                if (stale) return;
                setResult(r);
                setError("");
            })
            .catch((err) => !stale && setError(err instanceof ApiError ? err.message : "Could not load the audit log."));
        return () => {
            stale = true;
        };
    }, [page, entityType, entityId]);

    return (
        <div>
            <p className="mb-5 max-w-[560px] text-[12.5px] leading-relaxed text-grey">Every change made in the admin, newest first. Entries can&apos;t be edited or removed.</p>
            <div className="mb-5 flex flex-wrap gap-3">
                <select
                    aria-label="Filter by type"
                    value={entityType}
                    onChange={(e) => {
                        setPage(1);
                        setEntityType(e.target.value);
                    }}
                    className={FILTER_SELECT}
                >
                    <option value="">Everything</option>
                    {ENTITY_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                    ))}
                </select>
                <input
                    aria-label="Filter by id"
                    value={entityId}
                    onChange={(e) => {
                        setPage(1);
                        setEntityId(e.target.value);
                    }}
                    placeholder="Order number or id"
                    className={`${FIELD_INPUT} max-w-[220px]`}
                />
            </div>

            {error ? (
                <p className="text-[13px] text-alert">{error}</p>
            ) : !result ? (
                <p className="text-[13px] text-grey">Loading…</p>
            ) : result.items.length === 0 ? (
                <p className="text-[13px] text-grey">Nothing recorded yet.</p>
            ) : (
                <>
                    <ListPanel minWidth={820} footer={<>Showing {result.items.length} of {result.total.toLocaleString()}</>}>
                        <thead>
                            <tr className={TABLE_HEAD_ROW}>
                                {["When", "Who", "What", "Details"].map((h) => (
                                    <th key={h} scope="col" className={TABLE_TH}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {result.items.map((e) => (
                                <tr key={e.id} className="align-top">
                                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                                        <div className="text-[13px] text-ink">{dateOf(e.createdAt)}</div>
                                        <div className="font-mono text-[11px] text-grey">{timeOf(e.createdAt)}</div>
                                    </td>
                                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                                        <div className="text-[13px] text-ink">{e.actor.name}</div>
                                        <div className="font-mono text-[10.5px] tracking-[.1em] text-grey uppercase">{e.actor.type.toLowerCase()}</div>
                                    </td>
                                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                                        <div className="mb-1.5">
                                            <StatusBadge label={titleCase(e.action)} tone={ACTION_TONE[e.action] ?? "neutral"} />
                                        </div>
                                        <div className="text-[13px] text-ink">{titleCase(e.entityType)} <span className="font-mono text-[12px] text-grey">#{e.entityId}</span></div>
                                    </td>
                                    <td className={TABLE_TD}>
                                        <Details details={e.details} />
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
