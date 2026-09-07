"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Faq } from "@/library/admin/types";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import FaqModal from "@/components/admin/modals/FaqModal";
import FaqViewModal from "@/components/admin/modals/FaqViewModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";

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

    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(faqs.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = faqs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    function handleSave(data: Omit<Faq, "id">, id?: number) {
        if (id) onUpdate(id, data);
        else onAdd(data);
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <button onClick={() => router.push(BACK_HREF)} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Pages
                </button>
                <button
                    onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                    }}
                    className={BTN_ADD}
                >
                    + Add FAQ
                </button>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-off/50">
                            {["ID", "Question", ""].map((h) => (
                                <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {faqs.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-5 py-16 text-center text-[13px] text-grey">
                                    No FAQs yet.
                                </td>
                            </tr>
                        )}
                        {paged.map((f) => {
                            const i = faqs.findIndex((x) => x.id === f.id);
                            return (
                                <tr
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
                                    className="cursor-pointer transition hover:bg-off/40"
                                >
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-mono text-[12px] text-grey">{f.id}</span>
                                            <div className="flex flex-col gap-0.5 text-grey">
                                                <button
                                                    disabled={i === 0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onMove(f.id, "up");
                                                    }}
                                                    aria-label="Move up"
                                                    className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                                >
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <path d="M18 15l-6-6-6 6" />
                                                    </svg>
                                                </button>
                                                <button
                                                    disabled={i === faqs.length - 1}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onMove(f.id, "down");
                                                    }}
                                                    aria-label="Move down"
                                                    className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                                >
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <path d="M6 9l6 6 6-6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{f.q}</td>
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
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
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M12 20h9" />
                                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                    </svg>
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
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

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
