"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Faq } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR } from "@/components/admin/formClasses";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Mounted only while open, so fields init fresh from `item` with no reset effect needed.
export default function FaqModal({
    item,
    onClose,
    onSave,
}: {
    item: Faq | null;
    onClose: () => void;
    onSave: (data: Omit<Faq, "id">, id?: number) => void;
}) {
    const [q, setQ] = useState(item?.q ?? "");
    const [a, setA] = useState(item?.a ?? "");
    const [errors, setErrors] = useState<{ q?: string; a?: string }>({});
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    const isDirty = useIsDirty({ q, a });

    function requestClose() {
        if (isDirty) setConfirmCloseOpen(true);
        else onClose();
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { q?: string; a?: string } = {};
        if (!q.trim()) nextErrors.q = "A question is required.";
        if (!a.trim()) nextErrors.a = "An answer is required.";
        if (nextErrors.q || nextErrors.a) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
        await wait();
        onSave({ q: q.trim(), a: a.trim() }, item?.id);
        onClose();
    });

    return (
        <>
        <Modal open onClose={submitting ? () => {} : requestClose} maxWidth="max-w-[460px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{item ? "Edit FAQ" : "Add FAQ"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <div className="mb-4">
                    <label htmlFor="faq-question" className={FIELD_LABEL}>Question</label>
                    <input
                        id="faq-question"
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            if (errors.q) setErrors((er) => ({ ...er, q: undefined }));
                        }}
                        placeholder="e.g. How long does delivery take?"
                        aria-invalid={errors.q ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.q ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.q && <p className={FIELD_ERROR}>{errors.q}</p>}
                </div>

                <div>
                    <label htmlFor="faq-answer" className={FIELD_LABEL}>Answer</label>
                    <textarea
                        id="faq-answer"
                        rows={4}
                        value={a}
                        onChange={(e) => {
                            setA(e.target.value);
                            if (errors.a) setErrors((er) => ({ ...er, a: undefined }));
                        }}
                        placeholder="A clear, direct answer"
                        aria-invalid={errors.a ? true : undefined}
                        className={`${FIELD_INPUT} resize-y leading-relaxed ${errors.a ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.a && <p className={FIELD_ERROR}>{errors.a}</p>}
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save FAQ"}
                </button>
            </div>
        </Modal>
        <ConfirmModal
            open={confirmCloseOpen}
            title="Discard changes?"
            description="Your edits to this FAQ entry haven't been saved."
            confirmLabel="Discard"
            onConfirm={onClose}
            onClose={() => setConfirmCloseOpen(false)}
        />
        </>
    );
}
