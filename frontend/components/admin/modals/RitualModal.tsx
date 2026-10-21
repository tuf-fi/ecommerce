"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Ritual } from "@/library/admin/types";
import { PRODUCTS } from "@/library/products";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR, focusFirstInvalid } from "@/components/admin/formClasses";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

function resolveInitialImage(item: Ritual | null): string | null {
    if (!item || !item.image) return null;
    return typeof item.image === "string" ? item.image : item.image.src;
}

// Mounted only while open, so fields init fresh from `item` with no reset effect needed.
export default function RitualModal({
    item,
    onClose,
    onSave,
}: {
    item: Ritual | null;
    onClose: () => void;
    onSave: (data: Omit<Ritual, "id">, id?: number) => void;
}) {
    const [eyebrow, setEyebrow] = useState(item?.eyebrow ?? "");
    const [title, setTitle] = useState(item?.title ?? "");
    const [copy, setCopy] = useState(item?.copy ?? "");
    const [image, setImage] = useState<string | null>(resolveInitialImage(item));
    const [productIds, setProductIds] = useState<number[]>(item?.productIds ?? []);
    const [errors, setErrors] = useState<{ title?: string; image?: string; productIds?: string }>({});

    const isDirty = useIsDirty({ eyebrow, title, copy, image, productIds });


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

    function toggleProduct(id: number) {
        setProductIds((prev) => {
            const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
            if (next.length && errors.productIds) setErrors((er) => ({ ...er, productIds: undefined }));
            return next;
        });
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const nextErrors: { title?: string; image?: string; productIds?: string } = {};
        if (!title.trim()) nextErrors.title = "Title is required.";
        if (!image) nextErrors.image = "An image is required — this is shown full-size on the homepage Rituals section.";
        if (!productIds.length) nextErrors.productIds = "Select at least one product — this is what \"Shop Now\" adds to the customer's bag.";
        if (nextErrors.title || nextErrors.image || nextErrors.productIds) {
            setErrors(nextErrors);
            focusFirstInvalid("ritual-form");
            return;
        }
        setErrors({});
        await wait();
        onSave({ eyebrow: eyebrow.trim(), title: title.trim(), copy: copy.trim(), image, productIds }, item?.id);
        onClose();
    });

    return (
        <Modal
            open
            onClose={submitting ? () => {} : onClose}
            maxWidth="max-w-[520px]"
            heading={item ? "Edit Ritual" : "Add Ritual"}
            dirty={isDirty && !submitting}
            footer={
                <button type="submit" form="ritual-form" disabled={submitting} className="ui-btn ui-btn-primary w-full sm:w-auto">
                    {submitting ? "Saving…" : "Save Ritual"}
                </button>
            }
        >
            <form id="ritual-form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}>
                {/* Small square, not full-width — the full-size version is already visible on the homepage. */}
                <div className="mb-5 flex items-center gap-3.5">
                    <label className="focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-2 relative h-16 w-16 flex-none cursor-pointer overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                        {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-center font-mono text-label text-ink/60">+ Image</span>
                        )}
                        <input type="file" aria-label="Upload image" accept="image/*" onChange={handleImageChange} aria-invalid={errors.image ? true : undefined} aria-describedby={errors.image ? "ritual-image-error" : undefined} className="sr-only" />
                    </label>
                    <span className="text-label text-grey">Shown full-size on the homepage Rituals section</span>
                </div>
                {errors.image && <p id="ritual-image-error" role="alert" className={FIELD_ERROR}>{errors.image}</p>}

                <div className="mb-4">
                    <label htmlFor="ritual-eyebrow" className={FIELD_LABEL}>Eyebrow</label>
                    <input id="ritual-eyebrow" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="e.g. Ritual One" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label htmlFor="ritual-title" className={FIELD_LABEL}>Title</label>
                    <input
                        id="ritual-title"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (errors.title) setErrors((er) => ({ ...er, title: undefined }));
                        }}
                        placeholder="e.g. The Glass Skin Routine"
                        aria-invalid={errors.title ? true : undefined}
                        aria-describedby={errors.title ? "ritual-title-error" : undefined}
                        className={`${FIELD_INPUT} ${errors.title ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.title && <p id="ritual-title-error" role="alert" className={FIELD_ERROR}>{errors.title}</p>}
                </div>

                <div className="mb-5">
                    <label htmlFor="ritual-copy" className={FIELD_LABEL}>Copy</label>
                    <textarea
                        id="ritual-copy"
                        rows={3}
                        value={copy}
                        onChange={(e) => setCopy(e.target.value)}
                        placeholder="A short line describing the routine"
                        className={`${FIELD_INPUT} resize-y leading-relaxed`}
                    />
                </div>

                <fieldset className="m-0 border-0 p-0">
                    <legend className={FIELD_LABEL}>Products in this ritual ({productIds.length} selected)</legend>
                    {errors.productIds && <p id="ritual-productIds-error" role="alert" className={FIELD_ERROR}>{errors.productIds}</p>}
                    <div
                        tabIndex={errors.productIds ? -1 : undefined}
                        data-invalid={errors.productIds ? "true" : undefined}
                        aria-describedby={errors.productIds ? "ritual-productIds-error" : undefined}
                        className="thin-scrollbar max-h-56 overflow-y-auto border border-ink/10"
                    >
                        {PRODUCTS.map((p) => (
                            <label key={p.id} className="flex cursor-pointer items-center gap-3 border-b border-ink/5 px-4 py-2.5 text-meta text-ink last:border-b-0 hover:bg-off/50">
                                <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="accent-pink-btn" />
                                <span className="flex-1">{p.title}</span>
                                <span className="font-mono text-label text-grey">₱{p.price.toLocaleString()}</span>
                            </label>
                        ))}
                    </div>
                    <p className="mt-2 text-label text-grey">These are what &quot;Shop Now&quot; adds to the customer&apos;s bag.</p>
                </fieldset>
            </form>
        </Modal>
    );
}
