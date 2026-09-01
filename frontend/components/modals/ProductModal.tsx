"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "../ui/Modal";
import StarRating from "../ui/StarRating";
import { useStore } from "@/library/store";
import { PRODUCTS, getProduct } from "@/library/products";

export default function ProductModal() {
    const { activeModal, activeProductId, closeModal } = useStore();
    const open = activeModal === "product" && activeProductId !== null;

    return (
        <Modal open={open} onClose={closeModal} maxWidth="max-w-[720px]">
            {open && activeProductId !== null && <ProductModalContent key={activeProductId} id={activeProductId} />}
        </Modal>
    );
}

function ProductModalContent({ id }: { id: number }) {
    const product = getProduct(id);
    const { addToCart, wishlist, toggleWishlist, closeModal, openProduct } = useStore();
    const [qty, setQty] = useState(1);
    const [reviewOpen, setReviewOpen] = useState(false);

    if (!product) return null;
    const isWished = wishlist.includes(product.id);
    const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="relative aspect-square overflow-hidden sm:aspect-auto">
                <Image src={product.image} alt={product.title} fill sizes="(min-width: 640px) 360px, 100vw" className="object-cover" />
                <button
                    aria-label="Toggle wishlist"
                    onClick={() => toggleWishlist(product.id)}
                    className={`absolute top-4 left-4 flex h-9 w-9 items-center justify-center border transition ${
                        isWished ? "border-pink-btn bg-pink-btn text-white" : "border-ink/10 bg-white/90 text-ink"
                    }`}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                </button>
            </div>

            <div className="p-8">
                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{product.category}</span>
                <h3 className="mt-2 text-xl font-medium text-ink">{product.title}</h3>

                <button onClick={() => setReviewOpen((o) => !o)} className="mt-2 flex items-center gap-2">
                    <StarRating rating={product.rating} count={product.count} />
                    <span className="text-[11px] text-pink-dark underline underline-offset-2">Write a review</span>
                </button>

                <div className="mt-3 font-mono text-lg text-ink">₱{product.price.toLocaleString()}</div>
                <p className="mt-4 text-sm leading-relaxed text-grey">{product.desc}</p>

                <div className="mt-6 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-grey">Quantity</span>
                    <div className="flex items-center border border-ink/15">
                        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-ink transition hover:bg-off">–</button>
                        <span className="w-8 text-center text-sm text-ink">{qty}</span>
                        <button onClick={() => setQty((q) => q + 1)} className="px-3 py-1.5 text-ink transition hover:bg-off">+</button>
                    </div>
                </div>

                <button
                    onClick={() => {
                        addToCart(product.id, qty);
                        closeModal();
                    }}
                    className="mt-6 w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark"
                >
                    Add to Bag
                </button>

                {reviewOpen && <ReviewForm onClose={() => setReviewOpen(false)} />}

                {related.length > 0 && (
                    <div className="mt-8 border-t border-ink/10 pt-6">
                        <div className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-grey">You may also like</div>
                        <div className="flex flex-col gap-3">
                            {related.map((rp) => (
                                <button key={rp.id} onClick={() => openProduct(rp.id)} className="flex items-center gap-3 text-left">
                                    <div className="relative h-11 w-11 flex-none overflow-hidden">
                                        <Image src={rp.image} alt={rp.title} fill sizes="44px" className="object-cover" />
                                    </div>
                                    <div>
                                        <div className="text-[13px] text-ink">{rp.title}</div>
                                        <div className="font-mono text-[11px] text-grey">₱{rp.price.toLocaleString()}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReviewForm({ onClose }: { onClose: () => void }) {
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const { showToast } = useStore();

    // TODO: wire up to a real reviews API — this only holds local UI state, nothing is persisted.
    function submit() {
        if (!text.trim()) {
            showToast("error", "Add a few words before submitting.");
            return;
        }
        setSubmitted(true);
        showToast("success", "Review submitted for moderation.");
    }

    return (
        <div className="mt-5 border-t border-ink/10 pt-5">
            {submitted ? (
                <p className="text-center text-[12.5px] text-grey">Thanks! Your review is in for moderation and will appear once approved.</p>
            ) : (
                <>
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-grey">Write a review</div>
                    <div className="mb-3 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} onClick={() => setRating(n)} className={`text-lg ${n <= rating ? "text-gold" : "text-ink/15"}`}>
                                ★
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={3}
                        placeholder="What did you think?"
                        className="mb-3 w-full resize-none border border-ink/15 p-3 text-sm outline-none focus:border-pink-dark"
                    />
                    <div className="flex gap-2">
                        <button onClick={submit} className="flex-1 bg-navy py-3 text-[13px] font-semibold text-white transition hover:bg-pink-dark">
                            Submit Review
                        </button>
                        <button onClick={onClose} className="border border-ink/15 px-4 text-[13px] text-ink transition hover:bg-off">
                            Cancel
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
