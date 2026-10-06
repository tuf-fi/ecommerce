"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import AvatarUploadField from "@/components/admin/modals/AvatarUploadField";
import { Testimonial } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR } from "@/components/admin/formClasses";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { toast } from "sonner";

// Mounted only while open, so fields init fresh from `item` with no reset effect needed.
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
    const [errors, setErrors] = useState<{ name?: string; message?: string }>({});
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    const isDirty = useIsDirty({ name, company, position, message, image });

    function requestClose() {
        if (isDirty) setConfirmCloseOpen(true);
        else onClose();
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { name?: string; message?: string } = {};
        if (!name.trim()) nextErrors.name = "Name is required.";
        if (!message.trim()) nextErrors.message = "Testimonial message is required.";
        if (nextErrors.name || nextErrors.message) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
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
        <>
        <Modal open onClose={submitting ? () => {} : requestClose} maxWidth="max-w-[460px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-5 sm:px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{item ? "Edit Testimonial" : "Add Testimonial"}</h3>
            </div>
            <div className="px-5 sm:px-8 pt-6 pb-4">
                <AvatarUploadField photo={image} onPhotoChange={setImage} name={name} placeholder="New testimonial" />

                <div className="mb-4">
                    <label htmlFor="testimonial-name" className={FIELD_LABEL}>Name</label>
                    <input
                        id="testimonial-name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                        }}
                        placeholder="e.g. Andrea Cruz"
                        aria-invalid={errors.name ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.name ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.name && <p className={FIELD_ERROR}>{errors.name}</p>}
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
                        onChange={(e) => {
                            setMessage(e.target.value);
                            if (errors.message) setErrors((er) => ({ ...er, message: undefined }));
                        }}
                        placeholder="What they said"
                        aria-invalid={errors.message ? true : undefined}
                        className={`${FIELD_INPUT} resize-y leading-relaxed ${errors.message ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.message && <p className={FIELD_ERROR}>{errors.message}</p>}
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-5 sm:px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Testimonial"}
                </button>
            </div>
        </Modal>
        <ConfirmModal
            open={confirmCloseOpen}
            title="Discard changes?"
            description="Your edits to this testimonial haven't been saved."
            confirmLabel="Discard"
            onConfirm={onClose}
            onClose={() => setConfirmCloseOpen(false)}
        />
        </>
    );
}
