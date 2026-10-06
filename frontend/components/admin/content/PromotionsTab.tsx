"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useContent } from "@/library/content";
import Toggle from "@/components/ui/Toggle";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/admin/SearchField";
import { Toolbar, ToolbarFilters, FilterField, ListMeta } from "@/components/admin/Toolbar";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER, FILTER_SELECT } from "@/components/admin/formClasses";
import ListPanel from "@/components/admin/ListPanel";
import { EmptyStateRow } from "@/components/admin/EmptyState";
import { EditIcon, TrashIcon } from "@/components/admin/icons";

const PAGE_SIZE = 10;
type SortKey = "default" | "active-first";

export default function PromotionsTab() {
    const { promos, togglePromoActive, deletePromo } = useContent();
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortKey>("default");
    const [page, setPage] = useState(1);
    const deleting = promos.find((p) => p.id === deleteId) ?? null;

    const filtered = useMemo(() => {
        let list = promos;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((p) => p.text.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
        }
        if (sort === "active-first") list = [...list].sort((a, b) => Number(b.active) - Number(a.active));
        return list;
    }, [promos, search, sort]);

    // Render-time reset to page 1 on filter change, rather than an effect (see InventoryPage).
    const filterKey = `${search}|${sort}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

    return (
        <div>
            <Toolbar
                actions={
                    <Link href="/admin/content/promotions/new" className={BTN_ADD}>
                        + Add Promotion
                    </Link>
                }
                filters={
                    <ToolbarFilters>
                        <FilterField label="Search" className="min-w-[220px] flex-1">
                            <SearchField value={search} onChange={setSearch} placeholder="Search by text or code" className="w-full" />
                        </FilterField>
                        <FilterField label="Sort by" className="w-full flex-none sm:w-[170px]">
                            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${FILTER_SELECT} w-full`}>
                                <option value="default">Default</option>
                                <option value="active-first">Active First</option>
                            </select>
                        </FilterField>
                    </ToolbarFilters>
                }
            />

            <ListPanel minWidth={560}>
                    <thead>
                        <tr className="bg-off/50">
                            {["Promotion", "Code", "Active", ""].map((h) => (
                                <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 && (
                            <EmptyStateRow
                                colSpan={4}
                                variant={promos.length === 0 ? "empty" : "filtered"}
                                message={promos.length === 0 ? "No promotions yet." : "No promotions match this search."}
                            />
                        )}
                        {paged.map((p) => (
                            <tr key={p.id} className="transition hover:bg-off/40">
                                <td className="border-b border-ink/10 px-5 py-3.5 text-[13.5px] text-ink">{p.text}</td>
                                <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12px] text-grey">{p.code || "—"}</td>
                                <td className="border-b border-ink/10 px-5 py-3.5">
                                    <Toggle checked={p.active} onChange={() => togglePromoActive(p.id)} />
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3.5">
                                    <div className="flex items-center justify-end gap-2">
                                        <Tooltip label="Edit">
                                            <Link href={`/admin/content/promotions/${p.id}`} aria-label="Edit promotion" className={ICON_BTN}>
                                                <EditIcon />
                                            </Link>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(p.id)} aria-label="Remove promotion" className={ICON_BTN_DANGER}>
                                                <TrashIcon />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
            </ListPanel>

            <ListMeta>Showing {filtered.length} of {promos.length}</ListMeta>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this promotion?"
                description={deleting ? `"${deleting.text}" will no longer show on the site.` : undefined}
                onConfirm={() => deleteId !== null && deletePromo(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
