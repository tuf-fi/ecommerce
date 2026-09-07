"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import AvatarUploadField from "@/components/admin/modals/AvatarUploadField";
import { Testimonial } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Mounted only while the modal is open (see TestimonialsTab), so every field
// initializes fresh from `item` with no effect needed to "reset" it.
export default function TestimonialModal({
    item,
    onClose,
    onSave,
}: {
    item: Testimonial | null;
    onClose: () => void;
    onSave: (data: Omit<Testimonial, "id">, id?: number) => void;
}) {
    const [name, setName] = useState(item?.name ?? "");
    const [company, setCompany] = useState(item?.company ?? "");
    const [position, setPosition] = useState(item?.position ?? "");
    const [message, setMessage] = useState(item?.message ?? "");
    const [image, setImage] = useState<string | null>(item?.image ?? null);

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        if (!name.trim() || !message.trim()) return;
        await wait();
        onSave(
            {
                image,
                name: name.trim(),
                company: company.trim(),
                position: position.trim(),
                message: message.trim(),
            },
            item?.id
        );
        onClose();
    });

    return (
        <Modal open onClose={submitting ? () => {} : onClose} maxWidth="max-w-[460px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{item ? "Edit Testimonial" : "Add Testimonial"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <AvatarUploadField photo={image} onPhotoChange={setImage} name={name} placeholder="New testimonial" />

                <div className="mb-4">
                    <label htmlFor="testimonial-name" className={FIELD_LABEL}>Name</label>
                    <input id="testimonial-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Andrea Cruz" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label htmlFor="testimonial-company" className={FIELD_LABEL}>Company</label>
                    <input id="testimonial-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Cindyrella Skincare" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label htmlFor="testimonial-position" className={FIELD_LABEL}>Position</label>
                    <input id="testimonial-position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Marketing Lead" className={FIELD_INPUT} />
                </div>

                <div>
                    <label htmlFor="testimonial-message" className={FIELD_LABEL}>Message</label>
                    <textarea
                        id="testimonial-message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What they said"
                        className={`${FIELD_INPUT} resize-y leading-relaxed`}
                    />
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Testimonial"}
                </button>
            </div>
        </Modal>
    );
}
