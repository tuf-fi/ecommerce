"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { FooterLinkItem } from "@/library/admin/types";
import { FooterLinkGroup } from "@/library/content";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

const GROUP_LABEL: Record<FooterLinkGroup, string> = {
    shop: "Shop",
    company: "Company",
};

// Mounted only while the modal is open (see LinksTab), so every field
// initializes fresh from `link` with no effect needed to "reset" it.
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

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        if (!label.trim() || !href.trim()) return;
        await wait();
        onSave({ label: label.trim(), href: href.trim() }, link?.id);
        onClose();
    });

    return (
        <Modal open onClose={submitting ? () => {} : onClose} maxWidth="max-w-[380px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">
                    {link ? "Edit" : "Add"} {GROUP_LABEL[group]} Link
                </h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <div className="mb-4">
                    <label htmlFor="footer-link-label" className={FIELD_LABEL}>Label</label>
                    <input id="footer-link-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Shipping & Returns" className={FIELD_INPUT} />
                </div>
                <div>
                    <label htmlFor="footer-link-href" className={FIELD_LABEL}>Destination</label>
                    <input id="footer-link-href" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/pages/terms or /#contact" className={FIELD_INPUT} />
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
    );
}
