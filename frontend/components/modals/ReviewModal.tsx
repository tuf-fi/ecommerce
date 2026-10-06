"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useAsyncAction } from "@/library/useAsyncAction";
import { ApiError } from "@/library/api/client";
import { createReview } from "@/library/api/reviews";
import type { Review } from "@/library/reviews";

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

    // Render-time reset on open, not an effect — AnimatePresence keeps this mounted through the close animation.
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setRating(5);
            setText("");
        }
    }

    const [submitting, submit] = useAsyncAction(async () => {
        if (text.trim().length < 3) {
            showToast("error", "Add a few words before submitting.");
            return;
        }
        try {
            const { review } = await createReview({ productId, rating, text: text.trim() });
            onCreated(review);
            showToast("success", "Thanks — your review is live.");
            onClose();
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Couldn't submit your review. Please try again.");
        }
    });

    return (
        <Modal open={open} onClose={submitting ? () => {} : onClose} maxWidth="max-w-[440px]">
            <div className="p-8">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-grey">Write a review</div>
                <h3 className="mb-5 text-xl font-medium text-ink">Share your experience</h3>

                <div className="mb-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            type="button"
                            aria-label={`${n} star${n > 1 ? "s" : ""}`}
                            onClick={() => setRating(n)}
                            className={`text-xl ${n <= rating ? "text-gold" : "text-ink/15"}`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="What did you think?"
                    aria-label="Your review"
                    className="mb-4 w-full resize-none border border-ink/15 p-3 text-sm outline-none focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                />

                <div className="flex gap-2">
                    <button
                        onClick={submit}
                        disabled={submitting}
                        className="flex-1 bg-navy py-3 text-[13px] font-semibold text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy"
                    >
                        {submitting ? "Submitting…" : "Submit Review"}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="border border-ink/15 px-4 text-[13px] text-ink transition hover:bg-off disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}
