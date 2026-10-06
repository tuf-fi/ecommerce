"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { Concern } from "@/library/admin/types";
import { PRODUCTS } from "@/library/products";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ConcernModal from "@/components/admin/modals/ConcernModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { EditIcon, TrashIcon, BackLink } from "@/components/admin/icons";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { Toolbar } from "@/components/admin/Toolbar";

// Shared between the header and every row so their columns always line up exactly.
const GRID_COLS = "grid-cols-[24px_44px_1fr_110px_100px] min-w-[560px]";

export default function ConcernsTab() {
    const router = useRouter();
    const { concerns, addConcern, updateConcern, deleteConcern, moveConcern } = useContent();
    const [editing, setEditing] = useState<Concern | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleting = concerns.find((c) => c.id === deleteId) ?? null;

    function handleSave(data: Omit<Concern, "id" | "key">, id?: number) {
        if (id) updateConcern(id, data);
        else addConcern(data);
    }

    return (
        <div>
            {/* Reached via its own /admin/content/pages/concerns route (see the
                dispatcher in pages/[slug]/page.tsx), same as Testimonials —
                needs its own way back for the same reason, since this route
                renders with no tab bar above it. */}
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
                            + Add Concern
                        </button>
                    }
                />

                {concerns.length === 0 ? (
                    <div className="border border-ink/10 bg-white px-5 py-16 text-center text-[13px] text-grey">No concerns yet.</div>
                ) : (
                    <div className="overflow-x-auto border border-ink/10 bg-white">
                        <div className={`grid ${GRID_COLS} items-center gap-4 border-b border-ink/10 bg-off/50 px-5 py-3`}>
                            <span className="col-span-3 font-mono text-[11px] font-bold tracking-[.12em] text-grey uppercase">Concern</span>
                            <span className="font-mono text-[11px] font-bold tracking-[.12em] text-grey uppercase">Items</span>
                            <span aria-hidden="true" />
                        </div>
                        <div className="divide-y divide-ink/10">
                            {concerns.map((c, i) => {
                                const count = PRODUCTS.filter((p) => p.concerns?.includes(c.key)).length;
                                return (
                                    <div key={c.id} className={`grid ${GRID_COLS} items-center gap-4 px-5 py-4 transition hover:bg-off/40`}>
                                        <ReorderButtons index={i} count={concerns.length} onMove={(dir) => moveConcern(c.id, dir)} />
                                        <span className="h-11 w-11 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                                            {c.image && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={typeof c.image === "string" ? c.image : c.image.src} alt="" className="h-full w-full object-cover" />
                                            )}
                                        </span>
                                        <div className="min-w-0 truncate text-[14px] font-medium text-ink">{c.title}</div>
                                        <div className="text-[12px] text-grey">
                                            {count} product{count === 1 ? "" : "s"}
                                        </div>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Tooltip label="Edit">
                                                <button
                                                    onClick={() => {
                                                        setEditing(c);
                                                        setModalOpen(true);
                                                    }}
                                                    aria-label="Edit concern"
                                                    className={ICON_BTN}
                                                >
                                                    <EditIcon />
                                                </button>
                                            </Tooltip>
                                            <Tooltip label="Remove">
                                                <button onClick={() => setDeleteId(c.id)} aria-label="Remove concern" className={ICON_BTN_DANGER}>
                                                    <TrashIcon />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-ink/10 bg-off/50 px-5 py-2.5 text-right font-mono text-[11px] text-grey">
                            Showing {concerns.length} of {concerns.length}
                        </div>
                    </div>
                )}
            </div>

            {modalOpen && <ConcernModal item={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this concern?"
                description={deleting ? `"${deleting.title}" will be removed from the homepage Shop by Concern row.` : undefined}
                onConfirm={() => deleteId !== null && deleteConcern(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
