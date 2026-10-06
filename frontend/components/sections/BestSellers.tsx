"use client";

import Image from "next/image";
import Link from "next/link";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import StarRating from "../ui/StarRating";
import RevealIn from "../ui/motion/RevealIn";
import { STAGGER } from "../ui/motion/constants";
import { useStore } from "@/library/store";
import { useContent } from "@/library/content";
import { getProduct, cheapestSizeId } from "@/library/products";

const layout = [
    { id: 1, aspect: "aspect-[4/5]", cols: "md:grid-cols-[2fr_3fr]", imageFirst: true, overlap: "", align: "md:items-center", dir: "left" },
    { id: 2, aspect: "aspect-[4/3]", cols: "md:grid-cols-[3fr_2fr]", imageFirst: false, overlap: "md:-mt-12", align: "md:items-center", dir: "bottom" },
    { id: 3, aspect: "aspect-[3/4]", cols: "md:grid-cols-[2fr_3fr]", imageFirst: true, overlap: "md:-mt-4", align: "md:items-center", dir: "left" },
    { id: 7, aspect: "aspect-[3/2]", cols: "md:grid-cols-[2fr_3fr]", imageFirst: false, overlap: "md:-mt-10", align: "md:items-end", dir: "right" },
] as const;

function ProductImage({ id, aspect, title }: { id: number; aspect: string; title: string }) {
    const { wishlist, toggleWishlist } = useStore();
    const product = getProduct(id);
    const isWished = wishlist.includes(id);
    if (!product) return null;

    return (
        <div className={`relative block w-full ${aspect} overflow-hidden border border-ink/10 text-left`}>
            <Image src={product.image} alt={title} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
            <span
                role="button"
                tabIndex={0}
                aria-label="Toggle wishlist"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(id);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(id);
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
    );
}

export default function BestSellers(){
    const { addToCart } = useStore();
    const { sectionVisibility } = useContent();

    function handleAddToBag(id: number) {
        const product = getProduct(id);
        addToCart(id, 1, product ? cheapestSizeId(product) : null);
    }

    // No preview prop: Best Sellers has no editable copy, so there's no editor/preview pane — only the visibility toggle.
    if (!sectionVisibility.bestSellers) return null;

    return(
        <SectionContainer id="bestsellers">
            <SectionTitle section="bestSellers" title="Best Sellers" />

            <div className="flex flex-col gap-14 md:gap-0">
                {layout.map((row, index) => {
                    const product = getProduct(row.id);
                    if (!product) return null;
                    return (
                        <RevealIn
                            key={row.id}
                            direction={row.dir}
                            delay={index * STAGGER}
                        >
                            <Link
                                href={`/shop/${row.id}`}
                                className={`group grid grid-cols-1 gap-6 md:gap-12 ${row.cols} ${row.align} ${row.overlap}`}
                            >
                                {row.imageFirst && <ProductImage id={row.id} aspect={row.aspect} title={product.title} />}

                                <div className={row.imageFirst ? "" : "lg:text-right"}>
                                    <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{product.category}</span>
                                    <span
                                        className={`mt-2 mb-3 block w-full text-[clamp(20px,2vw,26px)] font-medium text-ink transition-colors group-hover:text-pink-dark ${row.imageFirst ? "text-left" : "text-left lg:text-right"}`}
                                    >
                                        {product.title}
                                    </span>
                                    <div className={`mb-4 flex ${row.imageFirst ? "" : "lg:justify-end"}`}>
                                        <StarRating rating={product.rating} count={product.count} />
                                    </div>
                                    <div className={`flex items-center gap-4 ${row.imageFirst ? "" : "lg:justify-end"}`}>
                                        <span className="font-mono text-sm text-ink">₱{product.price.toLocaleString()}</span>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleAddToBag(row.id);
                                            }}
                                            className="border border-ink/15 px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                                        >
                                            Add to Bag
                                        </button>
                                    </div>
                                </div>

                                {!row.imageFirst && (
                                    <div className="order-first md:order-none">
                                        <ProductImage id={row.id} aspect={row.aspect} title={product.title} />
                                    </div>
                                )}
                            </Link>
                        </RevealIn>
                    );
                })}
            </div>
        </SectionContainer>
    )
}
