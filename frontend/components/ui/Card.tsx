"use client";

import Image from "next/image";
import Link from "next/link";
import StarRating from "./StarRating";
import { useStore } from "@/library/store";
import { Product, cheapestSizeId } from "@/library/products";

export default function Card({ product }: { product: Product }) {
    const { wishlist, toggleWishlist, addToCart, openModal, isLoggedIn } = useStore();
    const isWished = wishlist.includes(product.id);

    function handleAddToBag() {
        if (!isLoggedIn) {
            openModal("login");
            return;
        }
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
                    aria-label="Toggle wishlist"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product.id);
                    }}
                    className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center border transition hover:border-pink-btn hover:bg-pink-btn hover:text-white ${
                        isWished ? "border-pink-btn bg-pink-btn text-white" : "border-white/40 bg-white/80 text-ink"
                    }`}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{product.category}</span>
                <span className="text-left text-[16.5px] font-medium leading-snug text-ink">
                    {product.title}
                </span>
                <StarRating rating={product.rating} count={product.count} />
                <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="font-mono text-[13px] text-ink">₱{product.price.toLocaleString()}</span>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToBag();
                        }}
                        className="border border-ink/15 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                    >
                        Add to Bag
                    </button>
                </div>
            </div>
        </Link>
    );
}
