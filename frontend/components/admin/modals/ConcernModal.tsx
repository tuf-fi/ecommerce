"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Concern } from "@/library/admin/types";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR, focusFirstInvalid } from "@/components/admin/formClasses";
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

    const isDirty = useIsDirty({ title, image });


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
            focusFirstInvalid("concern-form");
            return;
        }
        setErrors({});
        await wait();
        onSave({ title: title.trim(), image }, item?.id);
        onClose();
    });

    return (
        <Modal
            open
            onClose={submitting ? () => {} : onClose}
            maxWidth="max-w-[420px]"
            heading={item ? "Edit Concern" : "Add Concern"}
            dirty={isDirty && !submitting}
            footer={
                <button type="submit" form="concern-form" disabled={submitting} className="ui-btn ui-btn-primary w-full sm:w-auto">
                    {submitting ? "Saving…" : "Save Concern"}
                </button>
            }
        >
            <form id="concern-form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}>
                <div className="mb-1.5 flex items-center gap-3.5">
                    <label className="focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-2 relative h-16 w-16 flex-none cursor-pointer overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                        {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-center font-mono text-label text-ink/60">+ Image</span>
                        )}
                        <input type="file" aria-label="Upload image" accept="image/*" onChange={handleImageChange} aria-invalid={errors.image ? true : undefined} aria-describedby={errors.image ? "concern-image-error" : undefined} className="sr-only" />
                    </label>
                    <span className="text-label text-grey">Shown in the homepage Shop by Concern row</span>
                </div>
                {errors.image && <p id="concern-image-error" role="alert" className={FIELD_ERROR}>{errors.image}</p>}

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
                        aria-describedby={errors.title ? "concern-title-error" : undefined}
                        className={`${FIELD_INPUT} ${errors.title ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.title && <p id="concern-title-error" role="alert" className={FIELD_ERROR}>{errors.title}</p>}
                </div>
                {!item && (
                    <p className="mt-2 text-label text-grey">
                        Products aren&apos;t tagged with concerns from here yet — a new concern shows 0 products until it&apos;s added to the catalogue in code.
                    </p>
                )}
            </form>
        </Modal>
    );
}
