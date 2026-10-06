"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SiteNavLink } from "@/library/admin/types";
import { SECTION_KEYS, SECTION_LABELS, SectionKey } from "@/library/admin/sections";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR } from "@/components/admin/formClasses";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Mounted only while open, so fields init fresh from `link` with no reset effect needed.
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
    const [errors, setErrors] = useState<{ label?: string }>({});
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    const isDirty = useIsDirty({ label, section, inMore });

    function requestClose() {
        if (isDirty) setConfirmCloseOpen(true);
        else onClose();
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { label?: string } = {};
        if (!label.trim()) nextErrors.label = "Label is required.";
        if (nextErrors.label) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
        await wait();
        // Explicit `undefined` (not omitted) — saves merge as a patch, so omitting would leave a link stuck in "More".
        onSave({ label: label.trim(), section, group: inMore ? "more" : undefined }, link?.id);
        onClose();
    });

    return (
        <>
        <Modal open onClose={submitting ? () => {} : requestClose} maxWidth="max-w-[380px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-5 sm:px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{link ? "Edit Link" : "Add Link"}</h3>
            </div>
            <div className="px-5 sm:px-8 pt-6 pb-4">
                <div className="mb-4">
                    <label htmlFor="nav-link-label" className={FIELD_LABEL}>Label</label>
                    <input
                        id="nav-link-label"
                        value={label}
                        onChange={(e) => {
                            setLabel(e.target.value);
                            if (errors.label) setErrors((er) => ({ ...er, label: undefined }));
                        }}
                        placeholder="e.g. Rituals"
                        aria-invalid={errors.label ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.label ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.label && <p className={FIELD_ERROR}>{errors.label}</p>}
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
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-5 sm:px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Link"}
                </button>
            </div>
        </Modal>
        <ConfirmModal
            open={confirmCloseOpen}
            title="Discard changes?"
            description="Your edits to this nav link haven't been saved."
            confirmLabel="Discard"
            onConfirm={onClose}
            onClose={() => setConfirmCloseOpen(false)}
        />
        </>
    );
}
