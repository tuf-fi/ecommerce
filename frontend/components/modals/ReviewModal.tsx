"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal, { ModalClose } from "../ui/Modal";
import { useAsyncAction } from "@/library/useAsyncAction";
import { ApiError } from "@/library/api/client";
import { createReview, MAX_REVIEW_PHOTOS } from "@/library/api/reviews";
import type { Review } from "@/library/reviews";

const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function ReviewModal({
    open,
    onClose,
    productId,
    onCreated,
    showToast,
}: {
    open: boolean;
    onClose: () => void;
    productId: number;
    onCreated: (review: Review) => void;
    showToast: (type: "success" | "error", message: string) => void;
}) {
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const picker = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    // One preview address per chosen photo; released when the list changes or the dialog closes.
    const previews = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
    useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

    function pick(e: React.ChangeEvent<HTMLInputElement>) {
        const chosen = Array.from(e.target.files ?? []);
        e.target.value = "";
        addFiles(chosen);
    }

    // Shared by the file dialog (several files can be selected at once) and drag-and-drop.
    function addFiles(chosen: File[]) {
        if (chosen.length === 0) return;
        const next = [...photos];
        for (const f of chosen) {
            if (next.length >= MAX_REVIEW_PHOTOS) {
                showToast("error", `You can add up to ${MAX_REVIEW_PHOTOS} photos.`);
                break;
            }
            if (!ACCEPTED.includes(f.type)) {
                showToast("error", "Use JPG, PNG or WEBP photos.");
                continue;
            }
            if (f.size > MAX_BYTES) {
                showToast("error", `${f.name} is over 3MB. Choose a smaller one.`);
                continue;
            }
            next.push(f);
        }
        setPhotos(next);
    }

    function removePhoto(index: number) {
        setPhotos((list) => list.filter((_, i) => i !== index));
    }

    // Render-time reset on open, not an effect — AnimatePresence keeps this mounted through the close animation.
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setRating(5);
            setText("");
            setPhotos([]);
        }
    }

    const [submitting, submit] = useAsyncAction(async () => {
        if (text.trim().length < 3) {
            showToast("error", "Add a few words before submitting.");
            return;
        }
        try {
            const { review } = await createReview({ productId, rating, text: text.trim(), photos });
            onCreated(review);
            showToast("success", "Thanks — your review is live.");
            onClose();
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Couldn't submit your review. Please try again.");
        }
    });

    const dirty = text.trim() !== "" || photos.length > 0;

    return (
        <Modal
            open={open}
            onClose={submitting ? () => {} : onClose}
            maxWidth="max-w-[440px]"
            eyebrow="Write a review"
            heading="Share your experience"
            dirty={dirty && !submitting}
            footer={
                <>
                    <ModalClose asChild>
                        <button type="button" disabled={submitting} className="ui-btn ui-btn-secondary">
                            Cancel
                        </button>
                    </ModalClose>
                    <button type="submit" form="review-form" disabled={submitting} className="ui-btn ui-btn-primary">
                        {submitting ? "Submitting…" : "Submit review"}
                    </button>
                </>
            }
        >
            <form
                id="review-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                }}
            >
                <div role="radiogroup" aria-label="Rating" className="mb-3 flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={n === rating}
                            aria-label={`${n} star${n > 1 ? "s" : ""}`}
                            onClick={() => setRating(n)}
                            className={`flex h-11 w-11 items-center justify-center text-heading transition focus-visible:ring-2 focus-visible:ring-navy ${n <= rating ? "text-gold" : "text-gold/25"}`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    placeholder="What did you think?"
                    aria-label="Your review"
                    className="ui-input resize-none"
                />

                <input ref={picker} type="file" multiple accept={ACCEPTED.join(",")} onChange={pick} className="hidden" />
                {photos.length > 0 && (
                    <ul className="m-0 mt-4 grid list-none grid-cols-4 gap-2 p-0">
                        {photos.map((p, i) => (
                            <li key={`${p.name}-${i}`} className="relative aspect-square overflow-hidden border border-ink/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previews[i]} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(i)}
                                    aria-label={`Remove photo ${i + 1}`}
                                    className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center text-white drop-shadow-[0_0_3px_rgba(0,0,0,.8)] transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-white after:absolute after:-inset-3 after:content-['']"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                                        <path d="M6 6l12 12M18 6 6 18" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {photos.length < MAX_REVIEW_PHOTOS && (
                    <button
                        type="button"
                        onClick={() => picker.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragging(false);
                            addFiles(Array.from(e.dataTransfer.files));
                        }}
                        className={`mt-4 flex w-full items-center justify-center gap-2 border border-dashed py-3.5 ${dragging ? "border-navy bg-off text-ink" : "border-ink/25"} text-meta text-grey transition hover:border-navy hover:text-ink focus-visible:ring-2 focus-visible:ring-navy`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="14" rx="1.5" />
                            <circle cx="9" cy="11" r="2" />
                            <path d="m21 16-5-5L5 19" />
                        </svg>
                        {photos.length === 0 ? `Add photos (up to ${MAX_REVIEW_PHOTOS})` : `Add more (${photos.length}/${MAX_REVIEW_PHOTOS})`}
                    </button>
                )}
            </form>
        </Modal>
    );
}
