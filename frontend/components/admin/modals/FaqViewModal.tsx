"use client";

import Modal from "@/components/ui/Modal";
import { ViewHeader, DetailBody } from "@/components/admin/modals/ViewModalLayout";
import { Faq } from "@/library/admin/types";

export default function FaqViewModal({
    open,
    faq,
    onClose,
}: {
    open: boolean;
    faq: Faq | null;
    onClose: () => void;
}) {
    if (!faq) return null;

    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-[480px]">
            <ViewHeader eyebrow="FAQ" title={faq.q} />
            <DetailBody>
                <span className="mb-1.5 block font-mono text-[10px] tracking-[.14em] text-grey uppercase">Answer</span>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ink/85">{faq.a}</p>
            </DetailBody>
        </Modal>
    );
}
