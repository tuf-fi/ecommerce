"use client";

import Image from "next/image";
import Link from "next/link";
import StarRating from "./StarRating";
import PriceTag from "./PriceTag";
import { useStore } from "@/library/store";
import { Product, cheapestSizeId } from "@/library/products";

export default function Card({ product, size = "default", dense = false }: { product: Product; size?: "default" | "large"; dense?: boolean }) {
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
                    className={`absolute ${dense ? "top-2 right-2 h-10 w-10 sm:top-3 sm:right-3 sm:h-11 sm:w-11" : "top-3 right-3 h-11 w-11"} flex items-center justify-center border transition hover:border-pink-btn hover:bg-pink-btn hover:text-white ${
                        isWished ? "border-pink-btn bg-pink-btn text-white" : "border-white/40 bg-white/80 text-ink"
                    }`}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                </span>
            </div>

            <div className={`flex flex-1 flex-col ${dense ? "gap-1.5 sm:gap-2" : "gap-2"} ${dense ? (large ? "p-3 sm:p-7" : "p-3 sm:p-5") : large ? "p-6 sm:p-7" : "p-5"}`}>
                <span className={`font-mono uppercase tracking-[.16em] text-grey ${large ? "text-[11px]" : "text-[10px]"}`}>{product.category}</span>
                <span
                    className={`text-left font-medium leading-snug text-ink transition-colors group-hover:text-pink-dark ${large ? (dense ? "text-[14px] sm:text-[26px]" : "text-[22px] sm:text-[26px]") : dense ? "text-[14px] sm:text-[16.5px]" : "text-[16.5px]"}`}
                >
                    {product.title}
                </span>
                <StarRating rating={product.rating} count={product.count} stack={dense} />
                <div className={`mt-auto flex pt-3 ${dense ? "flex-col items-stretch gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-2.5 sm:pt-3" : "flex-wrap items-center justify-between gap-x-3 gap-y-2.5"}`}>
                    <PriceTag price={product.price} salePrice={product.salePrice} className={`font-mono text-ink ${large ? "text-[15px]" : "text-[13px]"}`} />
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToBag();
                        }}
                        className={`border border-ink/15 font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white ${
                            dense ? "w-full px-2 py-2.5 text-[10.5px] sm:w-auto sm:px-4 sm:py-2 sm:text-[11.5px]" : large ? "px-5 py-2.5 text-[12.5px]" : "px-4 py-2 text-[11.5px]"
                        }`}
                    >
                        Add to Bag
                    </button>
                </div>
            </div>
        </Link>
    );
}
