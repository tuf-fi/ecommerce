"use client";

import { SkeletonTable } from "@/components/ui/Skeleton";
import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { FILTER_SELECT, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import { FilterField, Toolbar, ToolbarFilters } from "@/components/admin/Toolbar";
import SearchField from "@/components/admin/SearchField";
import ListPanel from "@/components/admin/ListPanel";
import StatusBadge, { BadgeTone } from "@/components/admin/StatusBadge";
import { AuditEntry, listAuditLog, Paged } from "@/library/api/adminData";
import { ApiError } from "@/library/api/client";

const ENTITY_TYPES = ["order", "product", "voucher", "staff", "content"];
const TYPE_LABEL: Record<string, string> = { order: "Order", product: "Product", voucher: "Discount code", staff: "Staff", content: "Content" };

const ACTION_TONE: Record<string, BadgeTone> = { create: "success", delete: "alert", refund: "warning" };

const titleCase = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, " ");
const dateOf = (iso: string) => new Date(iso).toLocaleDateString([], { dateStyle: "medium" });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { timeStyle: "short" });

const CONTENT_LABEL: Record<string, string> = { faqs: "FAQs", visibility: "Section visibility", shipping: "Shipping", hero: "Hero", about: "About", contact: "Contact", footer: "Footer" };

// "#12" for numeric ids, the plain name for the rest ("LM-1029", "FAQs").
const entityRef = (type: string, id: string) => (/^\d+$/.test(id) ? `#${id}` : type === "content" ? (CONTENT_LABEL[id] ?? titleCase(id)) : id);

const peso = (n: string) => `₱${Number(n).toLocaleString()}`;

function formatValue(v: unknown): string {
    if (v === null || v === undefined || v === "") return "—";
    if (Array.isArray(v)) return v.map(formatValue).join(", ");
    if (typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${titleCase(k)} ${formatValue(x)}`).join(", ");
    return String(v);
}

type Row = { label: string; value: string };

// Product sizes are logged as "15ml@2800" (and "15ml@2800->1800" when the price changed). Only what changed is listed.
function sizeChanges(from: unknown, to: unknown): Row[] | null {
    if (!Array.isArray(from) || !Array.isArray(to)) return null;
    const parse = (x: unknown) => {
        const m = /^(.+?)@(\d+(?:\.\d+)?)(?:->(\d+(?:\.\d+)?))?$/.exec(String(x));
        return m ? { label: m[1], price: m[2], next: m[3] } : null;
    };
    const before = from.map(parse);
    const after = to.map(parse);
    if (before.some((x) => !x) || after.some((x) => !x)) return null;
    const rows: Row[] = [];
    const kept = new Set<string>();
    for (const x of after) {
        if (!x) continue;
        kept.add(x.label);
        const was = before.find((y) => y?.label === x.label);
        if (!was) rows.push({ label: x.label, value: `Added at ${peso(x.next ?? x.price)}` });
        else if (x.next) rows.push({ label: x.label, value: `${peso(x.price)} → ${peso(x.next)}` });
    }
    for (const y of before) if (y && !kept.has(y.label)) rows.push({ label: y.label, value: "Removed" });
    return rows;
}

// Plain rows for what changed. The raw size of a saved block (bytes) is noise, so it is left out.
function rowsOf(details: AuditEntry["details"]): Row[] {
    if (!details || typeof details !== "object") return [];
    const rows: Row[] = [];
    for (const [k, v] of Object.entries(details)) {
        if (k === "bytes") continue;
        if (v && typeof v === "object" && !Array.isArray(v) && "from" in v && "to" in v) {
            const { from, to } = v as { from: unknown; to: unknown };
            const sizes = k === "sizes" ? sizeChanges(from, to) : null;
            if (sizes) rows.push(...sizes);
            else rows.push({ label: titleCase(k), value: `${formatValue(from)} → ${formatValue(to)}` });
        } else if (k === "items") {
            const n = Number(v);
            rows.push({ label: "Saved", value: n === 0 ? "Empty list" : `${n} item${n === 1 ? "" : "s"}` });
        } else if (k === "changed") {
            rows.push({ label: "Changed", value: formatValue(v) });
        } else {
            rows.push({ label: titleCase(k), value: formatValue(v) });
        }
    }
    return rows;
}

function Details({ details }: { details: AuditEntry["details"] }) {
    const rows = rowsOf(details);
    if (rows.length === 0) return <span className="text-grey">—</span>;
    return (
        <dl className="m-0 flex max-w-[520px] flex-col gap-1">
            {rows.map((r, i) => (
                <div key={`${r.label}-${i}`} className="flex gap-3 text-meta leading-snug">
                    <dt className="w-[88px] flex-none truncate text-grey">{r.label}</dt>
                    <dd className="m-0 min-w-0 text-ink">{r.value}</dd>
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
        // A short pause after typing, so each keystroke isn't its own request.
        const t = setTimeout(() => {
            listAuditLog({ page, entityType: entityType || undefined, entityId: entityId.trim() || undefined })
                .then((r) => {
                    if (stale) return;
                    setResult(r);
                    setError("");
                })
                .catch((err) => !stale && setError(err instanceof ApiError ? err.message : "Could not load the audit log."));
        }, 250);
        return () => {
            stale = true;
            clearTimeout(t);
        };
    }, [page, entityType, entityId]);

    return (
        <div>
            <p className="mb-5 max-w-[560px] text-meta leading-relaxed text-grey">Every change made in the admin, newest first. Entries can&apos;t be edited or removed.</p>
            <Toolbar
                filters={
                    <ToolbarFilters>
                        <FilterField label="Search" className="min-w-[240px] flex-1">
                            <SearchField
                                value={entityId}
                                onChange={(v) => {
                                    setPage(1);
                                    setEntityId(v);
                                }}
                                placeholder="Order number or id"
                                className="w-full"
                            />
                        </FilterField>
                        <FilterField label="Type" className="w-full flex-none sm:w-[180px]">
                            <select
                                aria-label="Filter by type"
                                value={entityType}
                                onChange={(e) => {
                                    setPage(1);
                                    setEntityType(e.target.value);
                                }}
                                className={`${FILTER_SELECT} w-full`}
                            >
                                <option value="">Everything</option>
                                {ENTITY_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {TYPE_LABEL[t]}
                                    </option>
                                ))}
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
                <EmptyState title={entityType || entityId.trim() ? "No matches" : "Nothing recorded yet"} message={entityType || entityId.trim() ? "No entries match those filters." : "Changes made in the admin will be listed here."} />
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
                                <tr key={e.id} className="align-middle">
                                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                                        <div className="text-small text-ink">{dateOf(e.createdAt)}</div>
                                        <div className="text-label text-grey">{timeOf(e.createdAt)}</div>
                                    </td>
                                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                                        <div className="text-small text-ink">{e.actor.name}</div>
                                        <div className="text-label text-grey capitalize">{e.actor.type.toLowerCase()}</div>
                                    </td>
                                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                                        <div className="flex items-center gap-2.5">
                                            <StatusBadge label={titleCase(e.action)} tone={ACTION_TONE[e.action] ?? "neutral"} />
                                            <span className="text-small text-ink">
                                                {TYPE_LABEL[e.entityType] ?? titleCase(e.entityType)} <span className="font-mono text-meta text-grey">{entityRef(e.entityType, e.entityId)}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className={TABLE_TD}>
                                        <Details details={e.details} />
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
