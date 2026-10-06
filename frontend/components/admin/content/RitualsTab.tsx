"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { Ritual } from "@/library/admin/types";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import RitualModal from "@/components/admin/modals/RitualModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { EditIcon, TrashIcon, BackLink } from "@/components/admin/icons";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { Toolbar } from "@/components/admin/Toolbar";

// Shared between the header and every row so their columns always line up exactly.
const GRID_COLS = "grid-cols-[24px_44px_1fr_110px_100px] min-w-[560px]";

export default function RitualsTab() {
    const router = useRouter();
    const { rituals, addRitual, updateRitual, deleteRitual, moveRitual } = useContent();
    const [editing, setEditing] = useState<Ritual | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleting = rituals.find((r) => r.id === deleteId) ?? null;

    function handleSave(data: Omit<Ritual, "id">, id?: number) {
        if (id) updateRitual(id, data);
        else addRitual(data);
    }

    return (
        <div>
            {/* Reached via its own /admin/content/pages/rituals route (see the
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
                            + Add Ritual
                        </button>
                    }
                />

                {rituals.length === 0 ? (
                    <div className="border border-ink/10 bg-white px-5 py-16 text-center text-[13px] text-grey">No rituals yet.</div>
                ) : (
                    <div className="overflow-x-auto border border-ink/10 bg-white">
                        <div className={`grid ${GRID_COLS} items-center gap-4 border-b border-ink/10 bg-off/50 px-5 py-3`}>
                            <span className="col-span-3 font-mono text-[11px] font-bold tracking-[.12em] text-grey uppercase">Ritual</span>
                            <span className="font-mono text-[11px] font-bold tracking-[.12em] text-grey uppercase">Items</span>
                            <span aria-hidden="true" />
                        </div>
                        <div className="divide-y divide-ink/10">
                            {rituals.map((r, i) => (
                                <div key={r.id} className={`grid ${GRID_COLS} items-center gap-4 px-5 py-4 transition hover:bg-off/40`}>
                                    <ReorderButtons index={i} count={rituals.length} onMove={(dir) => moveRitual(r.id, dir)} />
                                    <span className="h-11 w-11 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                                        {r.image && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={typeof r.image === "string" ? r.image : r.image.src} alt="" className="h-full w-full object-cover" />
                                        )}
                                    </span>
                                    <div className="min-w-0 truncate text-[14px] font-medium text-ink">{r.title}</div>
                                    <div className="text-[12px] text-grey">
                                        {r.productIds.length} product{r.productIds.length === 1 ? "" : "s"}
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Tooltip label="Edit">
                                            <button
                                                onClick={() => {
                                                    setEditing(r);
                                                    setModalOpen(true);
                                                }}
                                                aria-label="Edit ritual"
                                                className={ICON_BTN}
                                            >
                                                <EditIcon />
                                            </button>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(r.id)} aria-label="Remove ritual" className={ICON_BTN_DANGER}>
                                                <TrashIcon />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-ink/10 bg-off/50 px-5 py-2.5 text-right font-mono text-[11px] text-grey">
                            Showing {rituals.length} of {rituals.length}
                        </div>
                    </div>
                )}
            </div>

            {modalOpen && <RitualModal item={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this ritual?"
                description={deleting ? `"${deleting.title}" will be removed from the homepage Rituals section.` : undefined}
                onConfirm={() => deleteId !== null && deleteRitual(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
