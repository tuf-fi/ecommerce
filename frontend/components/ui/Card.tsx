"use client";

import Image from "next/image";
import Link from "next/link";
import StarRating from "./StarRating";
import { useStore } from "@/library/store";
import { Product, cheapestSizeId } from "@/library/products";

export default function Card({ product, size = "default" }: { product: Product; size?: "default" | "large" }) {
    const { wishlist, toggleWishlist, addToCart } = useStore();
    const isWished = wishlist.includes(product.id);
    const large = size === "large";

    function handleAddToBag() {
        addToCart(product.id, 1, cheapestSizeId(product));
    }

    return (
        <Link
            href={`/shop/${product.id}`}
            className="group flex h-full w-full flex-col border border-ink/10 text-left transition hover:border-ink/30"
        >
            <div className="relative block aspect-[4/5] w-full overflow-hidden">
                <Image src={product.image} alt={product.title} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                <span
                    role="button"
                    tabIndex={0}
                    aria-label="Toggle wishlist"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product.id);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(product.id);
                        }
                    }}
                    className={`absolute top-3 right-3 flex h-11 w-11 items-center justify-center border transition hover:border-pink-btn hover:bg-pink-btn hover:text-white ${
                        isWished ? "border-pink-btn bg-pink-btn text-white" : "border-white/40 bg-white/80 text-ink"
                    }`}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                </span>
            </div>

            <div className={`flex flex-1 flex-col gap-2 ${large ? "p-6 sm:p-7" : "p-5"}`}>
                <span className={`font-mono uppercase tracking-[.16em] text-grey ${large ? "text-[11px]" : "text-[10px]"}`}>{product.category}</span>
                <span
                    className={`text-left font-medium leading-snug text-ink transition-colors group-hover:text-pink-dark ${large ? "text-[22px] sm:text-[26px]" : "text-[16.5px]"}`}
                >
                    {product.title}
                </span>
                <StarRating rating={product.rating} count={product.count} />
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 pt-3">
                    <span className={`font-mono text-ink ${large ? "text-[15px]" : "text-[13px]"}`}>₱{product.price.toLocaleString()}</span>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToBag();
                        }}
                        className={`border border-ink/15 font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white ${
                            large ? "px-5 py-2.5 text-[12.5px]" : "px-4 py-2 text-[11.5px]"
                        }`}
                    >
                        Add to Bag
                    </button>
                </div>
            </div>
        </Link>
    );
}
