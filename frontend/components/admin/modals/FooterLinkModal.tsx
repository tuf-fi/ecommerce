"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { FooterLinkItem } from "@/library/admin/types";
import { FooterLinkGroup } from "@/library/content";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR, focusFirstInvalid } from "@/components/admin/formClasses";
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

    const isDirty = useIsDirty({ label, href });


    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { label?: string; href?: string } = {};
        if (!label.trim()) nextErrors.label = "Label is required.";
        if (!href.trim()) nextErrors.href = "A link destination is required.";
        else if (!isSafeHref(href.trim())) {
            nextErrors.href = "Enter a route (/page), anchor (/#section), mailto:, tel:, or http(s):// URL.";
        }
        if (nextErrors.label || nextErrors.href) {
            setErrors(nextErrors);
            focusFirstInvalid("footerlink-form");
            return;
        }
        setErrors({});
        await wait();
        onSave({ label: label.trim(), href: href.trim() }, link?.id);
        onClose();
    });

    return (
        <Modal
            open
            onClose={submitting ? () => {} : onClose}
            maxWidth="max-w-[380px]"
            heading={`${link ? "Edit" : "Add"} ${GROUP_LABEL[group]} link`}
            dirty={isDirty && !submitting}
            footer={
                <button type="submit" form="footerlink-form" disabled={submitting} className="ui-btn ui-btn-primary w-full sm:w-auto">
                    {submitting ? "Saving…" : "Save Link"}
                </button>
            }
        >
            <form id="footerlink-form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}>
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
                        aria-describedby={errors.label ? "footerlink-label-error" : undefined}
                        className={`${FIELD_INPUT} ${errors.label ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.label && <p id="footerlink-label-error" role="alert" className={FIELD_ERROR}>{errors.label}</p>}
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
                        aria-describedby={errors.href ? "footerlink-href-error" : undefined}
                        className={`${FIELD_INPUT} ${errors.href ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.href && <p id="footerlink-href-error" role="alert" className={FIELD_ERROR}>{errors.href}</p>}
                    <p className="mt-2 text-label text-grey">
                        A route (<span className="font-mono">/journal</span>), a homepage anchor (<span className="font-mono">/#faq</span>), or a
                        full URL.
                    </p>
                </div>
            </form>
        </Modal>
    );
}
