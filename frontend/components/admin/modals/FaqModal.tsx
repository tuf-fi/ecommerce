"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Faq } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";

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

    function handleSubmit() {
        if (!q.trim() || !a.trim()) return;
        onSave({ q: q.trim(), a: a.trim() }, item?.id);
        onClose();
    }

    return (
        <Modal open onClose={onClose} maxWidth="max-w-[460px]">
            <div className="p-8">
                <h3 className="mb-5 text-xl font-medium text-ink">{item ? "Edit FAQ" : "Add FAQ"}</h3>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Question</label>
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. How long does delivery take?" className={FIELD_INPUT} />
                </div>

                <div className="mb-6">
                    <label className={FIELD_LABEL}>Answer</label>
                    <textarea
                        rows={4}
                        value={a}
                        onChange={(e) => setA(e.target.value)}
                        placeholder="A clear, direct answer"
                        className={`${FIELD_INPUT} resize-y leading-relaxed`}
                    />
                </div>

                <button onClick={handleSubmit} className={`w-full ${BTN_PRIMARY}`}>
                    Save FAQ
                </button>
            </div>
        </Modal>
    );
}
