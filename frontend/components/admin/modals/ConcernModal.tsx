"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Concern } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

function resolveInitialImage(item: Concern | null): string | null {
    if (!item || !item.image) return null;
    return typeof item.image === "string" ? item.image : item.image.src;
}

// Mounted only while the modal is open (see ConcernsTab), so every field
// initializes fresh from `item` with no effect needed to "reset" it. `key`
// (the stable id used to filter products, see the Concern type) is never
// edited here — it's set once on create and left alone.
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

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        if (!title.trim()) return;
        await wait();
        onSave({ title: title.trim(), image }, item?.id);
        onClose();
    });

    return (
        <Modal open onClose={submitting ? () => {} : onClose} maxWidth="max-w-[420px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{item ? "Edit Concern" : "Add Concern"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <div className="mb-5 flex items-center gap-3.5">
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

                <div>
                    <label htmlFor="concern-title" className={FIELD_LABEL}>Title</label>
                    <input id="concern-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dryness" className={FIELD_INPUT} />
                </div>
                {!item && (
                    <p className="mt-2 text-[11.5px] text-grey">
                        Products aren&apos;t tagged with concerns from here yet — a new concern shows 0 products until it&apos;s added to the catalogue in code.
                    </p>
                )}
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Concern"}
                </button>
            </div>
        </Modal>
    );
}
