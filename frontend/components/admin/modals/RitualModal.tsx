"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Ritual } from "@/library/admin/types";
import { PRODUCTS } from "@/library/products";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

function resolveInitialImage(item: Ritual | null): string | null {
    if (!item || !item.image) return null;
    return typeof item.image === "string" ? item.image : item.image.src;
}

// Mounted only while the modal is open (see RitualsTab), so every field
// initializes fresh from `item` with no effect needed to "reset" it.
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

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    }

    function toggleProduct(id: number) {
        setProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        if (!title.trim()) return;
        await wait();
        onSave({ eyebrow: eyebrow.trim(), title: title.trim(), copy: copy.trim(), image, productIds }, item?.id);
        onClose();
    });

    return (
        <Modal open onClose={submitting ? () => {} : onClose} maxWidth="max-w-[520px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{item ? "Edit Ritual" : "Add Ritual"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                {/* Small square, not a full-width preview — matches the Blog
                    post editor's image field treatment for the same reason
                    (the full-size version is already visible on the homepage). */}
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
                    <span className="text-[11.5px] text-grey">Shown full-size on the homepage Rituals section</span>
                </div>

                <div className="mb-4">
                    <label htmlFor="ritual-eyebrow" className={FIELD_LABEL}>Eyebrow</label>
                    <input id="ritual-eyebrow" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="e.g. Ritual One" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label htmlFor="ritual-title" className={FIELD_LABEL}>Title</label>
                    <input id="ritual-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Glass Skin Routine" className={FIELD_INPUT} />
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

                <div>
                    <label className={FIELD_LABEL}>Products in this ritual ({productIds.length} selected)</label>
                    <div className="thin-scrollbar max-h-56 overflow-y-auto border border-ink/10">
                        {PRODUCTS.map((p) => (
                            <label key={p.id} className="flex cursor-pointer items-center gap-3 border-b border-ink/5 px-4 py-2.5 text-[12.5px] text-ink last:border-b-0 hover:bg-off/50">
                                <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="accent-pink-btn" />
                                <span className="flex-1">{p.title}</span>
                                <span className="font-mono text-[11px] text-grey">₱{p.price.toLocaleString()}</span>
                            </label>
                        ))}
                    </div>
                    <p className="mt-2 text-[11.5px] text-grey">These are what &quot;Shop Now&quot; adds to the customer&apos;s bag.</p>
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Ritual"}
                </button>
            </div>
        </Modal>
    );
}
