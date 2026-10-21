"use client";

import Image from "next/image";
import Link from "next/link";
import StarRating from "./StarRating";
import PriceTag from "./PriceTag";
import WishlistButton from "./WishlistButton";
import { useStore } from "@/library/store";
import { Product, cheapestSizeId, isOnSale } from "@/library/products";

export default function Card({ product, size = "default", dense = false, badge }: { product: Product; size?: "default" | "large"; dense?: boolean; badge?: string }) {
    const { addToCart } = useStore();
    const large = size === "large";
    const soldOut = product.stock <= 0;
    const onSale = isOnSale(product) || !!product.sizes?.some(isOnSale);

    function handleAddToBag() {
        addToCart(product.id, 1, cheapestSizeId(product));
    }

    return (
        <div className="group relative flex h-full w-full flex-col border border-ink/10 text-left transition hover:border-ink/30 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-navy has-[a:focus-visible]:ring-offset-2">
            <div className="relative block aspect-[4/5] w-full overflow-hidden">
                <Image src={product.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                {(soldOut || badge || onSale) && (
                    <span
                        className={`absolute font-mono uppercase tracking-[.14em] text-label ${dense ? "top-2 left-2 px-1.5 py-1 sm:top-3 sm:left-3 sm:px-2" : "top-3 left-3 px-2 py-1"} ${
                            soldOut ? "bg-navy text-white" : "bg-pink-soft text-pink-dark"
                        }`}
                    >
                        {soldOut ? "Sold out" : (badge ?? "Sale")}
                    </span>
                )}
                <WishlistButton productId={product.id} className={`absolute z-10 ${dense ? "top-2 right-2 sm:top-3 sm:right-3" : "top-3 right-3"}`} />
            </div>

            <div className={`flex flex-1 flex-col ${dense ? "gap-1.5 sm:gap-2" : "gap-2"} ${dense ? (large ? "p-3 sm:p-7" : "p-3 sm:p-5") : large ? "p-6 sm:p-7" : "p-5"}`}>
                <span className={`font-mono uppercase tracking-[.16em] text-grey text-label`}>{product.category}</span>
                <Link
                    href={`/shop/${product.id}`}
                    className={`text-left font-medium leading-snug text-ink transition-colors after:absolute after:inset-0 hover:text-pink-dark focus-visible:outline-none ${large ? (dense ? "text-body sm:text-display-sm" : "text-heading sm:text-display-sm") : dense ? "text-body sm:text-lead" : "text-lead"}`}
                >
                    {product.title}
                </Link>
                <StarRating rating={product.rating} count={product.count} stack={dense} hideWhenUnrated />
                <div className={`mt-auto flex pt-3 ${dense ? "flex-col items-stretch gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-2.5 sm:pt-3" : "flex-wrap items-center justify-between gap-x-3 gap-y-2.5"}`}>
                    <PriceTag price={product.price} salePrice={product.salePrice} className={`font-mono text-ink ${large ? "text-body" : "text-small"}`} />
                    <button
                        disabled={soldOut}
                        onClick={handleAddToBag}
                        className={`ui-btn ui-btn-sm relative z-10 ${soldOut ? "cursor-not-allowed border border-dashed border-ink/25 bg-transparent text-grey" : "ui-btn-primary"} ${dense ? "w-full sm:w-auto" : ""}`}
                    >
                        {soldOut ? "Sold out" : "Add to Bag"}
                    </button>
                </div>
            </div>
        </div>
    );
}
