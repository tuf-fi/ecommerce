"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FooterLinkItem } from "@/library/admin/types";
import { FooterLinkGroup } from "@/library/content";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR } from "@/components/admin/formClasses";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { isSafeHref } from "@/library/url-safety";

const GROUP_LABEL: Record<FooterLinkGroup, string> = {
    shop: "Shop",
    company: "Company",
};

// Mounted only while open, so fields init fresh from `link` with no reset effect needed.
export default function FooterLinkModal({
    group,
    link,
    onClose,
    onSave,
}: {
    group: FooterLinkGroup;
    link: FooterLinkItem | null;
    onClose: () => void;
    onSave: (data: Omit<FooterLinkItem, "id">, id?: number) => void;
}) {
    const [label, setLabel] = useState(link?.label ?? "");
    const [href, setHref] = useState(link?.href ?? "");
    const [errors, setErrors] = useState<{ label?: string; href?: string }>({});
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    const isDirty = useIsDirty({ label, href });

    function requestClose() {
        if (isDirty) setConfirmCloseOpen(true);
        else onClose();
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { label?: string; href?: string } = {};
        if (!label.trim()) nextErrors.label = "Label is required.";
        if (!href.trim()) nextErrors.href = "A link destination is required.";
        else if (!isSafeHref(href.trim())) {
            nextErrors.href = "Enter a route (/page), anchor (/#section), mailto:, tel:, or http(s):// URL.";
        }
        if (nextErrors.label || nextErrors.href) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
        await wait();
        onSave({ label: label.trim(), href: href.trim() }, link?.id);
        onClose();
    });

    return (
        <>
        <Modal open onClose={submitting ? () => {} : requestClose} maxWidth="max-w-[380px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">
                    {link ? "Edit" : "Add"} {GROUP_LABEL[group]} Link
                </h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <div className="mb-4">
                    <label htmlFor="footer-link-label" className={FIELD_LABEL}>Label</label>
                    <input
                        id="footer-link-label"
                        value={label}
                        onChange={(e) => {
                            setLabel(e.target.value);
                            if (errors.label) setErrors((er) => ({ ...er, label: undefined }));
                        }}
                        placeholder="e.g. Shipping & Returns"
                        aria-invalid={errors.label ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.label ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.label && <p className={FIELD_ERROR}>{errors.label}</p>}
                </div>
                <div>
                    <label htmlFor="footer-link-href" className={FIELD_LABEL}>Destination</label>
                    <input
                        id="footer-link-href"
                        value={href}
                        onChange={(e) => {
                            setHref(e.target.value);
                            if (errors.href) setErrors((er) => ({ ...er, href: undefined }));
                        }}
                        placeholder="/pages/terms or /#contact"
                        aria-invalid={errors.href ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.href ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.href && <p className={FIELD_ERROR}>{errors.href}</p>}
                    <p className="mt-2 text-[11.5px] text-grey">
                        A route (<span className="font-mono">/journal</span>), a homepage anchor (<span className="font-mono">/#faq</span>), or a
                        full URL.
                    </p>
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Link"}
                </button>
            </div>
        </Modal>
        <ConfirmModal
            open={confirmCloseOpen}
            title="Discard changes?"
            description="Your edits to this footer link haven't been saved."
            confirmLabel="Discard"
            onConfirm={onClose}
            onClose={() => setConfirmCloseOpen(false)}
        />
        </>
    );
}
