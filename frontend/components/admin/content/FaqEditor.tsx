"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Faq } from "@/library/admin/types";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import FaqModal from "@/components/admin/modals/FaqModal";
import FaqViewModal from "@/components/admin/modals/FaqViewModal";
import SearchField from "@/components/admin/SearchField";
import { Toolbar, ToolbarFilters, FilterField } from "@/components/admin/Toolbar";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { EditIcon, TrashIcon, BackLink } from "@/components/admin/icons";
import ReorderButtons from "@/components/admin/ReorderButtons";

// Shared between the header and every row so their columns always line up exactly.
const GRID_COLS = "grid-cols-[24px_1fr_100px]";

const PAGE_SIZE = 10;
const BACK_HREF = "/admin/content?tab=pages";

export default function FaqEditor({
    faqs,
    onAdd,
    onUpdate,
    onDelete,
    onMove,
}: {
    faqs: Faq[];
    onAdd: (data: Omit<Faq, "id">) => void;
    onUpdate: (id: number, patch: Partial<Omit<Faq, "id">>) => void;
    onDelete: (id: number) => void;
    onMove: (id: number, direction: "up" | "down") => void;
}) {
    const router = useRouter();
    const [editing, setEditing] = useState<Faq | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewing, setViewing] = useState<Faq | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleting = faqs.find((f) => f.id === deleteId) ?? null;

    const [search, setSearch] = useState("");
    const filtered = useMemo(() => {
        if (!search.trim()) return faqs;
        const q = search.trim().toLowerCase();
        return faqs.filter((f) => f.q.toLowerCase().includes(q));
    }, [faqs, search]);

    const [page, setPage] = useState(1);
    // Render-time reset to page 1 on search change, rather than an effect (see InventoryPage).
    const [prevSearch, setPrevSearch] = useState(search);
    if (search !== prevSearch) {
        setPrevSearch(search);
        setPage(1);
    }
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    function handleSave(data: Omit<Faq, "id">, id?: number) {
        if (id) onUpdate(id, data);
        else onAdd(data);
    }

    return (
        <div>
            {/* Reached via its own /admin/content/pages/faq route (see the
                dispatcher in pages/[slug]/page.tsx), same as Concerns/Rituals/
                Testimonials — needs its own way back and section heading for
                the same reason those do, since this route renders with no tab
                bar above it. */}
            <div className="mb-6">
                <BackLink label="Pages" onClick={() => router.push(BACK_HREF)} />
            </div>

            <div>
                <Toolbar
                    actions={
                        <button
                            onClick={() => {
                                setEditing(null);
                                setModalOpen(true);
                            }}
                            className={BTN_ADD}
                        >
                            + Add FAQ
                        </button>
                    }
                    filters={
                        <ToolbarFilters>
                            <FilterField label="Search" className="min-w-[220px] flex-1">
                                <SearchField value={search} onChange={setSearch} placeholder="Search questions" className="w-full" />
                            </FilterField>
                        </ToolbarFilters>
                    }
                />

                {faqs.length === 0 ? (
                    <div className="border border-ink/10 bg-white px-5 py-16 text-center text-[13px] text-grey">No FAQs yet.</div>
                ) : paged.length === 0 ? (
                    <div className="border border-ink/10 bg-white px-5 py-16 text-center text-[13px] text-grey">No FAQs match this search.</div>
                ) : (
                    <div className="border border-ink/10 bg-white">
                        <div className={`grid ${GRID_COLS} items-center gap-4 border-b border-ink/10 bg-off/50 px-5 py-3`}>
                            <span className="col-span-2 font-mono text-[11px] font-bold tracking-[.12em] text-grey uppercase">Question</span>
                            <span aria-hidden="true" />
                        </div>
                        <div className="divide-y divide-ink/10">
                            {paged.map((f) => {
                                const i = faqs.findIndex((x) => x.id === f.id);
                                return (
                                    <div
                                        key={f.id}
                                        onClick={() => setViewing(f)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View FAQ: ${f.q}`}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setViewing(f);
                                            }
                                        }}
                                        className={`grid ${GRID_COLS} cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-off/40`}
                                    >
                                        <ReorderButtons index={i} count={faqs.length} onMove={(dir) => onMove(f.id, dir)} />
                                        <div className="min-w-0 truncate text-[14px] font-medium text-ink">{f.q}</div>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Tooltip label="Edit">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditing(f);
                                                        setModalOpen(true);
                                                    }}
                                                    aria-label="Edit FAQ"
                                                    className={ICON_BTN}
                                                >
                                                    <EditIcon />
                                                </button>
                                            </Tooltip>
                                            <Tooltip label="Remove">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteId(f.id);
                                                    }}
                                                    aria-label="Remove FAQ"
                                                    className={ICON_BTN_DANGER}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-ink/10 bg-off/50 px-5 py-2.5 text-right font-mono text-[11px] text-grey">
                            Showing {filtered.length} of {faqs.length}
                        </div>
                    </div>
                )}

                <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            </div>

            <FaqViewModal open={viewing !== null} faq={viewing} onClose={() => setViewing(null)} />

            {modalOpen && <FaqModal item={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this FAQ?"
                description={deleting ? `"${deleting.q}" will be removed from the FAQ section.` : undefined}
                onConfirm={() => deleteId !== null && onDelete(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
