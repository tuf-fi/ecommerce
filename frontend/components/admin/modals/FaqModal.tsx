"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Faq } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Mounted only while the modal is open (see the FAQ table), so every field
// initializes fresh from `item` with no effect needed to "reset" it.
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

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        if (!q.trim() || !a.trim()) return;
        await wait();
        onSave({ q: q.trim(), a: a.trim() }, item?.id);
        onClose();
    });

    return (
        <Modal open onClose={submitting ? () => {} : onClose} maxWidth="max-w-[460px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{item ? "Edit FAQ" : "Add FAQ"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <div className="mb-4">
                    <label htmlFor="faq-question" className={FIELD_LABEL}>Question</label>
                    <input id="faq-question" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. How long does delivery take?" className={FIELD_INPUT} />
                </div>

                <div>
                    <label htmlFor="faq-answer" className={FIELD_LABEL}>Answer</label>
                    <textarea
                        id="faq-answer"
                        rows={4}
                        value={a}
                        onChange={(e) => setA(e.target.value)}
                        placeholder="A clear, direct answer"
                        className={`${FIELD_INPUT} resize-y leading-relaxed`}
                    />
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save FAQ"}
                </button>
            </div>
        </Modal>
    );
}
