"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useContent } from "@/library/content";
import Toggle from "@/components/ui/Toggle";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import { BTN_ADD, ICON_BTN_DANGER } from "@/components/admin/formClasses";

const PAGE_SIZE = 10;

export default function PromotionsTab() {
    const { promos, togglePromoActive, deletePromo } = useContent();
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const deleting = promos.find((p) => p.id === deleteId) ?? null;

    const totalPages = Math.max(1, Math.ceil(promos.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = useMemo(() => promos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [promos, currentPage]);

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <h3 className="m-0 text-[15px] font-medium text-ink">Promo Banners</h3>
                <Link href="/admin/content/promotions/new" className={BTN_ADD}>
                    + Add Promotion
                </Link>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-off/50">
                            {["Promotion", "Code", "Active", ""].map((h) => (
                                <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-16 text-center text-[13px] text-grey">
                                    No promotions yet.
                                </td>
                            </tr>
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
                                            <Link
                                                href={`/admin/content/promotions/${p.id}`}
                                                aria-label="Edit promotion"
                                                className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-ink/10 text-ink transition hover:border-ink/25 hover:bg-off"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                </svg>
                                            </Link>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(p.id)} aria-label="Remove promotion" className={ICON_BTN_DANGER}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M4 7h16" />
                                                    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                                    <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
                                                    <path d="M10 11v6M14 11v6" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
