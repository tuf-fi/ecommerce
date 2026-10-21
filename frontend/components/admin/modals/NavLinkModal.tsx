"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { SiteNavLink } from "@/library/admin/types";
import { SECTION_KEYS, SECTION_LABELS, SectionKey } from "@/library/admin/sections";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR, focusFirstInvalid } from "@/components/admin/formClasses";
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

    const isDirty = useIsDirty({ label, section, inMore });


    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { label?: string } = {};
        if (!label.trim()) nextErrors.label = "Label is required.";
        if (nextErrors.label) {
            setErrors(nextErrors);
            focusFirstInvalid("navlink-form");
            return;
        }
        setErrors({});
        await wait();
        // Explicit `undefined` (not omitted) — saves merge as a patch, so omitting would leave a link stuck in "More".
        onSave({ label: label.trim(), section, group: inMore ? "more" : undefined }, link?.id);
        onClose();
    });

    return (
        <Modal
            open
            onClose={submitting ? () => {} : onClose}
            maxWidth="max-w-[380px]"
            heading={link ? "Edit Link" : "Add Link"}
            dirty={isDirty && !submitting}
            footer={
                <button type="submit" form="navlink-form" disabled={submitting} className="ui-btn ui-btn-primary w-full sm:w-auto">
                    {submitting ? "Saving…" : "Save Link"}
                </button>
            }
        >
            <form id="navlink-form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}>
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
                        aria-describedby={errors.label ? "navlink-label-error" : undefined}
                        className={`${FIELD_INPUT} ${errors.label ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.label && <p id="navlink-label-error" role="alert" className={FIELD_ERROR}>{errors.label}</p>}
                </div>

                <div className="mb-4">
                    <label htmlFor="nav-link-section" className={FIELD_LABEL}>Section</label>
                    <select id="nav-link-section" value={section} onChange={(e) => setSection(e.target.value as SectionKey)} className="ui-select">
                        {SECTION_KEYS.map((key) => (
                            <option key={key} value={key}>
                                {SECTION_LABELS[key]}
                            </option>
                        ))}
                    </select>
                    <p className="mt-2 text-label text-grey">
                        Scrolls to that section on the homepage. A link disappears from the nav on its own while its section is
                        switched off.
                    </p>
                </div>

                <div>
                    <label htmlFor="nav-link-placement" className={FIELD_LABEL}>Placement</label>
                    <select id="nav-link-placement" value={inMore ? "more" : "main"} onChange={(e) => setInMore(e.target.value === "more")} className="ui-select">
                        <option value="main">Main row</option>
                        <option value="more">&quot;More&quot; dropdown</option>
                    </select>
                    <p className="mt-2 text-label text-grey">Desktop only — the mobile menu always shows one flat list.</p>
                </div>
            </form>
        </Modal>
    );
}
