"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { SiteNavLink } from "@/library/admin/types";
import { SECTION_KEYS, SECTION_LABELS, SectionKey } from "@/library/admin/sections";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Mounted only while the modal is open (see LinksTab), so every field
// initializes fresh from `link` with no effect needed to "reset" it.
export default function NavLinkModal({
    link,
    onClose,
    onSave,
}: {
    link: SiteNavLink | null;
    onClose: () => void;
    onSave: (data: Omit<SiteNavLink, "id">, id?: number) => void;
}) {
    const [label, setLabel] = useState(link?.label ?? "");
    const [section, setSection] = useState<SectionKey>(link?.section ?? "about");
    const [inMore, setInMore] = useState(link?.group === "more");

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        if (!label.trim()) return;
        await wait();
        // Explicitly `undefined` rather than omitted — an edit is applied as a
        // merge patch, so leaving the key out would keep a link stuck in the
        // "More" dropdown after it's been moved back to the main row.
        onSave({ label: label.trim(), section, group: inMore ? "more" : undefined }, link?.id);
        onClose();
    });

    return (
        <Modal open onClose={submitting ? () => {} : onClose} maxWidth="max-w-[380px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{link ? "Edit Link" : "Add Link"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <div className="mb-4">
                    <label htmlFor="nav-link-label" className={FIELD_LABEL}>Label</label>
                    <input id="nav-link-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Rituals" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label htmlFor="nav-link-section" className={FIELD_LABEL}>Section</label>
                    <select id="nav-link-section" value={section} onChange={(e) => setSection(e.target.value as SectionKey)} className={FIELD_INPUT}>
                        {SECTION_KEYS.map((key) => (
                            <option key={key} value={key}>
                                {SECTION_LABELS[key]}
                            </option>
                        ))}
                    </select>
                    <p className="mt-2 text-[11.5px] text-grey">
                        Scrolls to that section on the homepage. A link disappears from the nav on its own while its section is
                        switched off.
                    </p>
                </div>

                <div>
                    <label htmlFor="nav-link-placement" className={FIELD_LABEL}>Placement</label>
                    <select id="nav-link-placement" value={inMore ? "more" : "main"} onChange={(e) => setInMore(e.target.value === "more")} className={FIELD_INPUT}>
                        <option value="main">Main row</option>
                        <option value="more">&quot;More&quot; dropdown</option>
                    </select>
                    <p className="mt-2 text-[11.5px] text-grey">Desktop only — the mobile menu always shows one flat list.</p>
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Link"}
                </button>
            </div>
        </Modal>
    );
}
