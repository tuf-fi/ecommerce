"use client";

import Image from "next/image";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import StarRating from "../ui/StarRating";
import RevealIn from "../ui/motion/RevealIn";
import { STAGGER } from "../ui/motion/constants";
import { useStore } from "@/library/store";
import { getProduct } from "@/library/products";

const layout = [
    { id: 1, aspect: "aspect-[4/5]", cols: "grid-cols-[2fr_3fr]", imageFirst: true, overlap: "", align: "items-center", dir: "left" },
    { id: 2, aspect: "aspect-[4/3]", cols: "grid-cols-[3fr_2fr]", imageFirst: false, overlap: "-mt-12", align: "items-center", dir: "bottom" },
    { id: 3, aspect: "aspect-[3/4]", cols: "grid-cols-[2fr_3fr]", imageFirst: true, overlap: "-mt-4", align: "items-center", dir: "left" },
    { id: 7, aspect: "aspect-[3/2]", cols: "grid-cols-[2fr_3fr]", imageFirst: false, overlap: "-mt-10", align: "items-end", dir: "right" },
] as const;

function ProductImage({ id, aspect, title }: { id: number; aspect: string; title: string }) {
    const { wishlist, toggleWishlist, openProduct } = useStore();
    const product = getProduct(id);
    const isWished = wishlist.includes(id);
    if (!product) return null;

    return (
        <button onClick={() => openProduct(id)} className={`relative block w-full ${aspect} overflow-hidden border border-ink/10 text-left`}>
            <Image src={product.image} alt={title} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
            <span
                role="button"
                aria-label="Toggle wishlist"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(id);
                }}
                className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center border transition ${
                    isWished ? "border-pink-btn bg-pink-btn text-white" : "border-white/40 bg-white/80 text-ink"
                }`}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                </svg>
            </span>
        </button>
    );
}

export default function BestSellers(){
    const { openProduct, openModal, isLoggedIn } = useStore();

    function handleAddToBag(id: number) {
        if (!isLoggedIn) {
            openModal("login");
            return;
        }
        openProduct(id);
    }

    return(
        <SectionContainer id="bestsellers">
            <SectionTitle num="02" title="Best Sellers" />

            <div className="flex flex-col">
                {layout.map((row, index) => {
                    const product = getProduct(row.id);
                    if (!product) return null;
                    return (
                        <RevealIn
                            key={row.id}
                            direction={row.dir}
                            delay={index * STAGGER}
                            className={`grid gap-12 ${row.cols} ${row.align} ${row.overlap}`}
                        >
                            {row.imageFirst && <ProductImage id={row.id} aspect={row.aspect} title={product.title} />}

                            <div className={row.imageFirst ? "" : "text-right"}>
                                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{product.category}</span>
                                <button
                                    onClick={() => openProduct(row.id)}
                                    className={`mt-2 mb-3 block w-full text-[clamp(20px,2vw,26px)] font-medium text-ink ${row.imageFirst ? "text-left" : "text-right"}`}
                                >
                                    {product.title}
                                </button>
                                <div className={`mb-4 flex ${row.imageFirst ? "" : "justify-end"}`}>
                                    <StarRating rating={product.rating} count={product.count} />
                                </div>
                                <div className={`flex items-center gap-4 ${row.imageFirst ? "" : "justify-end"}`}>
                                    <span className="font-mono text-sm text-ink">₱{product.price.toLocaleString()}</span>
                                    <button
                                        onClick={() => handleAddToBag(row.id)}
                                        className="border border-ink/15 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                                    >
                                        Add to Bag
                                    </button>
                                </div>
                            </div>

                            {!row.imageFirst && <ProductImage id={row.id} aspect={row.aspect} title={product.title} />}
                        </RevealIn>
                    );
                })}
            </div>
        </SectionContainer>
    )
}
