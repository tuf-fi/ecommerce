"use client";

import { useStore } from "@/library/store";

// 36px heart toggle with a 44px tap area shared by cards, rows and the product page; position it with `className`.
export default function WishlistButton({ productId, className = "" }: { productId: number; className?: string }) {
    const { wishlist, toggleWishlist } = useStore();
    const isWished = wishlist.includes(productId);

    return (
        <button
            type="button"
            aria-label={isWished ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={isWished}
            onClick={() => toggleWishlist(productId)}
            className={`${className.includes("absolute") ? "" : "relative"} flex h-9 w-9 flex-none items-center justify-center border after:absolute after:-inset-1 after:content-[''] transition hover:border-pink-btn hover:bg-pink-btn hover:text-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
                isWished ? "border-pink-btn bg-pink-btn text-white" : "border-ink/10 bg-white text-ink"
            } ${className}`}
        >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
        </button>
    );
}
