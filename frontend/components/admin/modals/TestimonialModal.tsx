"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Testimonial } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";

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

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    }

    function handleSubmit() {
        if (!name.trim() || !message.trim()) return;
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
    }

    return (
        <Modal open onClose={onClose} maxWidth="max-w-[460px]">
            <div className="p-8">
                <h3 className="mb-5 text-xl font-medium text-ink">{item ? "Edit Testimonial" : "Add Testimonial"}</h3>

                <div className="mb-5 flex items-center gap-4">
                    <label className="relative h-16 w-16 flex-none cursor-pointer overflow-hidden rounded-full bg-blue-soft">
                        {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-ink/60">
                                {name.charAt(0).toUpperCase() || "+"}
                            </span>
                        )}
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                    <div>
                        <div className="text-[13.5px] font-medium text-ink">{name || "New testimonial"}</div>
                        <label className="mt-1 block cursor-pointer text-[12px] text-pink-dark underline decoration-1 underline-offset-2 hover:text-pink-dark/80">
                            Change photo
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Andrea Cruz" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Company</label>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Cindyrella Skincare" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Position</label>
                    <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Marketing Lead" className={FIELD_INPUT} />
                </div>

                <div className="mb-6">
                    <label className={FIELD_LABEL}>Message</label>
                    <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What they said"
                        className={`${FIELD_INPUT} resize-y leading-relaxed`}
                    />
                </div>

                <button onClick={handleSubmit} className={`w-full ${BTN_PRIMARY}`}>
                    Save Testimonial
                </button>
            </div>
        </Modal>
    );
}
