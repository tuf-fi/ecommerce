"use client";

import { useState } from "react";
import { useContent } from "@/library/content";
import { Testimonial } from "@/library/admin/types";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import TestimonialModal from "@/components/admin/modals/TestimonialModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";

const PAGE_SIZE = 10;

// Same initials fallback as app/admin/(panel)/staff/page.tsx, for testimonials
// with no uploaded photo.
function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function TestimonialsTab() {
    const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial, moveTestimonial } = useContent();
    const [editing, setEditing] = useState<Testimonial | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleting = testimonials.find((t) => t.id === deleteId) ?? null;

    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(testimonials.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = testimonials.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    function handleSave(data: Omit<Testimonial, "id">, id?: number) {
        if (id) updateTestimonial(id, data);
        else addTestimonial(data);
    }

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <h3 className="m-0 text-[15px] font-medium text-ink">Testimonials</h3>
                <button
                    onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                    }}
                    className={BTN_ADD}
                >
                    + Add Testimonial
                </button>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-off/50">
                            {["ID", "Image", "Name", "Company", "Position", "Message", ""].map((h) => (
                                <th key={h} className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {testimonials.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-5 py-16 text-center text-[13px] text-grey">
                                    No testimonials yet.
                                </td>
                            </tr>
                        )}
                        {testimonials.map((t, i) => (
                            <tr key={t.id} className="transition hover:bg-off/40">
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-mono text-[12px] text-grey">{t.id}</span>
                                        <div className="flex flex-col gap-0.5 text-grey">
                                            <button
                                                disabled={i === 0}
                                                onClick={() => moveTestimonial(t.id, "up")}
                                                aria-label="Move up"
                                                className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M18 15l-6-6-6 6" />
                                                </svg>
                                            </button>
                                            <button
                                                disabled={i === testimonials.length - 1}
                                                onClick={() => moveTestimonial(t.id, "down")}
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
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-blue-soft font-mono text-[11px] text-ink">
                                        {t.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={t.image} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            initials(t.name)
                                        )}
                                    </span>
                                </td>
                                <td className="max-w-[180px] border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{t.name}</td>
                                <td className="max-w-[160px] border-b border-ink/10 px-5 py-3 text-[13px] text-grey">{t.company}</td>
                                <td className="max-w-[160px] border-b border-ink/10 px-5 py-3 text-[13px] text-grey">{t.position}</td>
                                <td className="max-w-[320px] border-b border-ink/10 px-5 py-3 text-[13px] text-grey">
                                    <span className="line-clamp-2">{t.message}</span>
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <Tooltip label="Edit">
                                            <button
                                                onClick={() => {
                                                    setEditing(t);
                                                    setModalOpen(true);
                                                }}
                                                aria-label="Edit testimonial"
                                                className={ICON_BTN}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(t.id)} aria-label="Remove testimonial" className={ICON_BTN_DANGER}>
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

            {modalOpen && <TestimonialModal item={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this testimonial?"
                description={deleting ? `"${deleting.name}" will be removed from the testimonials section.` : undefined}
                onConfirm={() => deleteId !== null && deleteTestimonial(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
