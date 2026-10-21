"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import AvatarUploadField from "@/components/admin/modals/AvatarUploadField";
import { Testimonial } from "@/library/admin/types";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR, focusFirstInvalid } from "@/components/admin/formClasses";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

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

    const isDirty = useIsDirty({ name, company, position, message, image });


    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { name?: string; message?: string } = {};
        if (!name.trim()) nextErrors.name = "Name is required.";
        if (!message.trim()) nextErrors.message = "Testimonial message is required.";
        if (nextErrors.name || nextErrors.message) {
            setErrors(nextErrors);
            focusFirstInvalid("testimonial-form");
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
        <Modal
            open
            onClose={submitting ? () => {} : onClose}
            maxWidth="max-w-[460px]"
            heading={item ? "Edit Testimonial" : "Add Testimonial"}
            dirty={isDirty && !submitting}
            footer={
                <button type="submit" form="testimonial-form" disabled={submitting} className="ui-btn ui-btn-primary w-full sm:w-auto">
                    {submitting ? "Saving…" : "Save Testimonial"}
                </button>
            }
        >
            <form id="testimonial-form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}>
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
                        aria-describedby={errors.name ? "testimonial-name-error" : undefined}
                        className={`${FIELD_INPUT} ${errors.name ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.name && <p id="testimonial-name-error" role="alert" className={FIELD_ERROR}>{errors.name}</p>}
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
                        aria-describedby={errors.message ? "testimonial-message-error" : undefined}
                        className={`${FIELD_INPUT} resize-y leading-relaxed ${errors.message ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.message && <p id="testimonial-message-error" role="alert" className={FIELD_ERROR}>{errors.message}</p>}
                </div>
            </form>
        </Modal>
    );
}
