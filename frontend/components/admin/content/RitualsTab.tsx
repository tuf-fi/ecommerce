"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { Ritual } from "@/library/admin/types";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import RitualModal from "@/components/admin/modals/RitualModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";

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
                <button onClick={() => router.push("/admin/content?tab=pages")} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Pages
                </button>
            </div>

            <div className="mb-5 flex items-center justify-between">
                <h3 className="m-0 text-[15px] font-medium text-ink">Rituals</h3>
                <button
                    onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                    }}
                    className={BTN_ADD}
                >
                    + Add Ritual
                </button>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-off/50">
                            {["ID", "Title", "Products", ""].map((h) => (
                                <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rituals.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-16 text-center text-[13px] text-grey">
                                    No rituals yet.
                                </td>
                            </tr>
                        )}
                        {rituals.map((r, i) => (
                            <tr key={r.id} className="transition hover:bg-off/40">
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-mono text-[12px] text-grey">{r.id}</span>
                                        <div className="flex flex-col gap-0.5 text-grey">
                                            <button
                                                disabled={i === 0}
                                                onClick={() => moveRitual(r.id, "up")}
                                                aria-label="Move up"
                                                className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M18 15l-6-6-6 6" />
                                                </svg>
                                            </button>
                                            <button
                                                disabled={i === rituals.length - 1}
                                                onClick={() => moveRitual(r.id, "down")}
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
                                    <div className="flex items-center gap-3">
                                        <span className="h-9 w-9 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                                            {r.image && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={typeof r.image === "string" ? r.image : r.image.src} alt="" className="h-full w-full object-cover" />
                                            )}
                                        </span>
                                        <span className="text-[13.5px] font-medium text-ink">{r.title}</span>
                                    </div>
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3 text-[13px] text-grey">{r.productIds.length}</td>
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <Tooltip label="Edit">
                                            <button
                                                onClick={() => {
                                                    setEditing(r);
                                                    setModalOpen(true);
                                                }}
                                                aria-label="Edit ritual"
                                                className={ICON_BTN}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(r.id)} aria-label="Remove ritual" className={ICON_BTN_DANGER}>
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
