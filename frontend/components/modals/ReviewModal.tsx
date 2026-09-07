"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

export type NewReview = { rating: number; author: string; text: string };

export default function ReviewModal({
    open,
    onClose,
    onSubmit,
    showToast,
    defaultAuthor = "",
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (review: NewReview) => void;
    showToast: (type: "success" | "error", message: string) => void;
    defaultAuthor?: string;
}) {
    const [rating, setRating] = useState(5);
    const [author, setAuthor] = useState(defaultAuthor);
    const [text, setText] = useState("");

    // Reset the form fields whenever the modal freshly opens — a render-time
    // state adjustment rather than an effect, since AnimatePresence keeps
    // this component mounted through the close animation.
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setRating(5);
            setAuthor(defaultAuthor);
            setText("");
        }
    }

    const [submitting, submit] = useAsyncAction(async () => {
        if (!author.trim() || !text.trim()) {
            showToast("error", "Add your name and a few words before submitting.");
            return;
        }
        // TODO: wire up to a real reviews API — this only holds local UI state, nothing is persisted.
        await wait();
        onSubmit({ rating, author: author.trim(), text: text.trim() });
        showToast("success", "Review submitted for moderation.");
        await wait(400);
        onClose();
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

                <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your name"
                    className="mb-3 w-full border border-ink/15 p-3 text-sm outline-none focus:border-pink-dark"
                />
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="What did you think?"
                    className="mb-4 w-full resize-none border border-ink/15 p-3 text-sm outline-none focus:border-pink-dark"
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
