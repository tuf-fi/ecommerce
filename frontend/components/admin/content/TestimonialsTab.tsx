"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { Testimonial } from "@/library/admin/types";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import TestimonialModal from "@/components/admin/modals/TestimonialModal";
import TestimonialViewModal from "@/components/admin/modals/TestimonialViewModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { EditIcon, TrashIcon, BackLink } from "@/components/admin/icons";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { Toolbar } from "@/components/admin/Toolbar";

// Shared between the header and every row so their columns always line up exactly.
const GRID_COLS = "grid-cols-[24px_44px_1fr_160px_100px] min-w-[620px]";

const PAGE_SIZE = 10;

// Same initials fallback as app/admin/(panel)/staff/page.tsx.
function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function TestimonialsTab() {
    const router = useRouter();
    const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial, moveTestimonial } = useContent();
    const [editing, setEditing] = useState<Testimonial | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewing, setViewing] = useState<Testimonial | null>(null);
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
            {/* Reached via its own /admin/content/pages/testimonials route (see
                the dispatcher in pages/[slug]/page.tsx), same as Hero/About/FAQ
                — needs its own way back for the same reason those do, since
                this route renders with no tab bar above it. */}
            <div className="mb-6">
                <BackLink label="Pages" onClick={() => router.push("/admin/content?tab=pages")} />
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
                            + Add Testimonial
                        </button>
                    }
                />

                {testimonials.length === 0 ? (
                    <div className="border border-ink/10 bg-white px-5 py-16 text-center text-[13px] text-grey">No testimonials yet.</div>
                ) : (
                    <div className="overflow-x-auto border border-ink/10 bg-white">
                        <div className={`grid ${GRID_COLS} items-center gap-4 border-b border-ink/10 bg-off/50 px-5 py-3`}>
                            <span className="col-span-3 font-mono text-[11px] font-bold tracking-[.12em] text-grey uppercase">Name</span>
                            <span className="font-mono text-[11px] font-bold tracking-[.12em] text-grey uppercase">Company</span>
                            <span aria-hidden="true" />
                        </div>
                        <div className="divide-y divide-ink/10">
                            {paged.map((t) => {
                                const i = testimonials.findIndex((x) => x.id === t.id);
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setViewing(t)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View testimonial from ${t.name}`}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setViewing(t);
                                            }
                                        }}
                                        className={`grid ${GRID_COLS} cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-off/40`}
                                    >
                                        <ReorderButtons index={i} count={testimonials.length} onMove={(dir) => moveTestimonial(t.id, dir)} />
                                        <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full bg-blue-soft font-mono text-[11px] text-ink">
                                            {t.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={t.image} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                initials(t.name)
                                            )}
                                        </span>
                                        <div className="min-w-0 truncate text-[14px] font-medium text-ink">{t.name}</div>
                                        <div className="truncate text-[12px] text-grey">{t.company}</div>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Tooltip label="Edit">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditing(t);
                                                        setModalOpen(true);
                                                    }}
                                                    aria-label="Edit testimonial"
                                                    className={ICON_BTN}
                                                >
                                                    <EditIcon />
                                                </button>
                                            </Tooltip>
                                            <Tooltip label="Remove">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteId(t.id);
                                                    }}
                                                    aria-label="Remove testimonial"
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
                            Showing {testimonials.length} of {testimonials.length}
                        </div>
                    </div>
                )}

                <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            </div>

            <TestimonialViewModal open={viewing !== null} testimonial={viewing} onClose={() => setViewing(null)} />

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
