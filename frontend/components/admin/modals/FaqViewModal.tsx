"use client";

import Modal from "@/components/ui/Modal";
import { ViewHeader, DetailBody, SectionLabel } from "@/components/admin/modals/ViewModalLayout";
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
        <Modal open={open} onClose={onClose} maxWidth="max-w-[480px]" titleInBody>
            <ViewHeader title={faq.q} />
            <DetailBody>
                <SectionLabel label="Answer" />
                <p className="text-small leading-relaxed whitespace-pre-wrap text-ink/85">{faq.a}</p>
            </DetailBody>
        </Modal>
    );
}
