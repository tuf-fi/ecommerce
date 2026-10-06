"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Concern } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR } from "@/components/admin/formClasses";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

function resolveInitialImage(item: Concern | null): string | null {
    if (!item || !item.image) return null;
    return typeof item.image === "string" ? item.image : item.image.src;
}

// Mounted only while open, so fields init fresh from `item`; `key` is set on create and never edited here.
export default function ConcernModal({
    item,
    onClose,
    onSave,
}: {
    item: Concern | null;
    onClose: () => void;
    onSave: (data: Omit<Concern, "id" | "key">, id?: number) => void;
}) {
    const [title, setTitle] = useState(item?.title ?? "");
    const [image, setImage] = useState<string | null>(resolveInitialImage(item));
    const [errors, setErrors] = useState<{ title?: string; image?: string }>({});
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    const isDirty = useIsDirty({ title, image });

    function requestClose() {
        if (isDirty) setConfirmCloseOpen(true);
        else onClose();
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result as string);
            if (errors.image) setErrors((er) => ({ ...er, image: undefined }));
        };
        reader.readAsDataURL(file);
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { title?: string; image?: string } = {};
        if (!title.trim()) nextErrors.title = "Title is required.";
        if (!image) nextErrors.image = "An image is required — this tile is shown on the homepage Shop by Concern row.";
        if (nextErrors.title || nextErrors.image) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
        await wait();
        onSave({ title: title.trim(), image }, item?.id);
        onClose();
    });

    return (
        <>
        <Modal open onClose={submitting ? () => {} : requestClose} maxWidth="max-w-[420px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-5 sm:px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{item ? "Edit Concern" : "Add Concern"}</h3>
            </div>
            <div className="px-5 sm:px-8 pt-6 pb-4">
                <div className="mb-1.5 flex items-center gap-3.5">
                    <label className="relative h-16 w-16 flex-none cursor-pointer overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                        {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-center font-mono text-[9px] text-ink/60">+ Image</span>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    <span className="text-[11.5px] text-grey">Shown in the homepage Shop by Concern row</span>
                </div>
                {errors.image && <p className={FIELD_ERROR}>{errors.image}</p>}

                <div className="mt-4">
                    <label htmlFor="concern-title" className={FIELD_LABEL}>Title</label>
                    <input
                        id="concern-title"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (errors.title) setErrors((er) => ({ ...er, title: undefined }));
                        }}
                        placeholder="e.g. Dryness"
                        aria-invalid={errors.title ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.title ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.title && <p className={FIELD_ERROR}>{errors.title}</p>}
                </div>
                {!item && (
                    <p className="mt-2 text-[11.5px] text-grey">
                        Products aren&apos;t tagged with concerns from here yet — a new concern shows 0 products until it&apos;s added to the catalogue in code.
                    </p>
                )}
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-5 sm:px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Concern"}
                </button>
            </div>
        </Modal>
        <ConfirmModal
            open={confirmCloseOpen}
            title="Discard changes?"
            description="Your edits to this concern haven't been saved."
            confirmLabel="Discard"
            onConfirm={onClose}
            onClose={() => setConfirmCloseOpen(false)}
        />
        </>
    );
}
