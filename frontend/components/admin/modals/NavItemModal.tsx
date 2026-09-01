"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useContent } from "@/library/content";
import { NavLinkType, NavMenuItem } from "@/library/admin/types";
import { CATEGORIES } from "@/library/products";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";

const NAV_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

function inferType(link: string): NavLinkType {
    if (link.startsWith("/pages/")) return "page";
    if (link.startsWith("#") && NAV_CATEGORIES.some((c) => link === `#${c.toLowerCase()}`)) return "category";
    return "custom";
}

// Mounted only while the modal is open (see NavigationTab), so every field
// initializes fresh from `item` with no effect needed to "reset" it.
export default function NavItemModal({
    item,
    onClose,
    onSave,
}: {
    item: NavMenuItem | null;
    onClose: () => void;
    onSave: (data: Omit<NavMenuItem, "id">, id?: number) => void;
}) {
    const { pages } = useContent();
    const [label, setLabel] = useState(item?.label ?? "");
    const [linkType, setLinkType] = useState<NavLinkType>(item ? inferType(item.link) : "category");
    const [value, setValue] = useState(item?.link ?? `#${NAV_CATEGORIES[0].toLowerCase()}`);

    function handleTypeChange(t: NavLinkType) {
        setLinkType(t);
        if (t === "category") setValue(`#${NAV_CATEGORIES[0].toLowerCase()}`);
        else if (t === "page") setValue(pages[0] ? `/pages/${pages[0].slug}` : "");
        else setValue("");
    }

    function handleSubmit() {
        if (!label.trim() || !value.trim()) return;
        onSave({ label: label.trim(), link: value.trim() }, item?.id);
        onClose();
    }

    return (
        <Modal open onClose={onClose} maxWidth="max-w-[380px]">
            <div className="p-8">
                <h3 className="mb-5 text-xl font-medium text-ink">{item ? "Edit Menu Item" : "Add Menu Item"}</h3>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Label</label>
                    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. New Arrivals" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Links To</label>
                    <select value={linkType} onChange={(e) => handleTypeChange(e.target.value as NavLinkType)} className={FIELD_INPUT}>
                        <option value="category">A category on the shop page</option>
                        <option value="page">A static page</option>
                        <option value="custom">Custom URL / anchor</option>
                    </select>
                </div>

                <div className="mb-6">
                    <label className={FIELD_LABEL}>Value</label>
                    {linkType === "category" && (
                        <select value={value} onChange={(e) => setValue(e.target.value)} className={FIELD_INPUT}>
                            {NAV_CATEGORIES.map((c) => (
                                <option key={c} value={`#${c.toLowerCase()}`}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    )}
                    {linkType === "page" && (
                        <select value={value} onChange={(e) => setValue(e.target.value)} className={FIELD_INPUT}>
                            {pages.map((p) => (
                                <option key={p.id} value={`/pages/${p.slug}`}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {linkType === "custom" && (
                        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="#contact or https://…" className={FIELD_INPUT} />
                    )}
                </div>

                <button onClick={handleSubmit} className={`w-full ${BTN_PRIMARY}`}>
                    Save Menu Item
                </button>
            </div>
        </Modal>
    );
}
