"use client";

import { useState } from "react";
import { useAdminStore } from "@/library/adminStore";
import { NavMenuItem } from "@/library/admin/types";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import NavItemModal from "@/components/admin/modals/NavItemModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";

export default function NavigationTab() {
    const { navMenu, addNavItem, updateNavItem, deleteNavItem, moveNavItem } = useAdminStore();
    const [editing, setEditing] = useState<NavMenuItem | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleting = navMenu.find((n) => n.id === deleteId) ?? null;

    function handleSave(data: Omit<NavMenuItem, "id">, id?: number) {
        if (id) updateNavItem(id, data);
        else addNavItem(data);
    }

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <h3 className="m-0 text-[15px] font-medium text-ink">Navigation Menu</h3>
                <button
                    onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                    }}
                    className={BTN_ADD}
                >
                    + Add Menu Item
                </button>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-off/50">
                            {["Order", "Label", "Links To", ""].map((h) => (
                                <th key={h} className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {navMenu.map((item, i) => (
                            <tr key={item.id} className="transition hover:bg-off/40">
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <div className="flex flex-col gap-0.5 text-grey">
                                        <button
                                            disabled={i === 0}
                                            onClick={() => moveNavItem(item.id, "up")}
                                            aria-label="Move up"
                                            className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M18 15l-6-6-6 6" />
                                            </svg>
                                        </button>
                                        <button
                                            disabled={i === navMenu.length - 1}
                                            onClick={() => moveNavItem(item.id, "down")}
                                            aria-label="Move down"
                                            className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{item.label}</td>
                                <td className="border-b border-ink/10 px-5 py-3 font-mono text-[12px] text-grey">{item.link}</td>
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <Tooltip label="Edit">
                                            <button
                                                onClick={() => {
                                                    setEditing(item);
                                                    setModalOpen(true);
                                                }}
                                                aria-label="Edit menu item"
                                                className={ICON_BTN}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(item.id)} aria-label="Remove menu item" className={ICON_BTN_DANGER}>
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

            {modalOpen && <NavItemModal item={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this menu item?"
                description={deleting ? `"${deleting.label}" will be removed from the site navigation.` : undefined}
                onConfirm={() => deleteId !== null && deleteNavItem(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
