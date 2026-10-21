"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Faq } from "@/library/admin/types";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR, focusFirstInvalid } from "@/components/admin/formClasses";
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

    const isDirty = useIsDirty({ q, a });


    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { q?: string; a?: string } = {};
        if (!q.trim()) nextErrors.q = "A question is required.";
        if (!a.trim()) nextErrors.a = "An answer is required.";
        if (nextErrors.q || nextErrors.a) {
            setErrors(nextErrors);
            focusFirstInvalid("faq-form");
            return;
        }
        setErrors({});
        await wait();
        onSave({ q: q.trim(), a: a.trim() }, item?.id);
        onClose();
    });

    return (
        <Modal
            open
            onClose={submitting ? () => {} : onClose}
            maxWidth="max-w-[460px]"
            heading={item ? "Edit FAQ" : "Add FAQ"}
            dirty={isDirty && !submitting}
            footer={
                <button type="submit" form="faq-form" disabled={submitting} className="ui-btn ui-btn-primary w-full sm:w-auto">
                    {submitting ? "Saving…" : "Save FAQ"}
                </button>
            }
        >
            <form id="faq-form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}>
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
                        aria-describedby={errors.q ? "faq-q-error" : undefined}
                        className={`${FIELD_INPUT} ${errors.q ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.q && <p id="faq-q-error" role="alert" className={FIELD_ERROR}>{errors.q}</p>}
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
                        aria-describedby={errors.a ? "faq-a-error" : undefined}
                        className={`${FIELD_INPUT} resize-y leading-relaxed ${errors.a ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.a && <p id="faq-a-error" role="alert" className={FIELD_ERROR}>{errors.a}</p>}
                </div>
            </form>
        </Modal>
    );
}
