"use client";

import Image from "next/image";
import WishlistButton from "@/components/ui/WishlistButton";
import Link from "next/link";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import StarRating from "../ui/StarRating";
import RevealIn from "../ui/motion/RevealIn";
import { STAGGER } from "../ui/motion/constants";
import { useStore } from "@/library/store";
import { useContent } from "@/library/content";
import { getProduct, cheapestSizeId } from "@/library/products";
import PriceTag from "@/components/ui/PriceTag";

const layout = [
    { id: 1, aspect: "aspect-[4/5]", cols: "md:grid-cols-[2fr_3fr]", imageFirst: true, overlap: "", align: "md:items-center", dir: "left" },
    { id: 2, aspect: "aspect-[4/3]", cols: "md:grid-cols-[3fr_2fr]", imageFirst: false, overlap: "md:-mt-12", align: "md:items-center", dir: "bottom" },
    { id: 3, aspect: "aspect-[3/4]", cols: "md:grid-cols-[2fr_3fr]", imageFirst: true, overlap: "md:-mt-4", align: "md:items-center", dir: "left" },
    { id: 7, aspect: "aspect-[3/2]", cols: "md:grid-cols-[2fr_3fr]", imageFirst: false, overlap: "md:-mt-10", align: "md:items-end", dir: "right" },
] as const;

function ProductImage({ id, aspect, title }: { id: number; aspect: string; title: string }) {
    const product = getProduct(id);
    if (!product) return null;

    return (
        <div className={`relative block w-full ${aspect} overflow-hidden border border-ink/10 text-left`}>
            <Image src={product.image} alt="" fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
            <WishlistButton productId={id} className="absolute top-3 right-3 z-10" />
            <span className="sr-only">{title}</span>
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
            <SectionTitle animate section="bestSellers" title="Best Sellers" />

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
                            <div className={`group relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-navy has-[a:focus-visible]:ring-offset-4 grid grid-cols-1 gap-6 md:gap-12 ${row.cols} ${row.align} ${row.overlap}`}>
                                {row.imageFirst && <ProductImage id={row.id} aspect={row.aspect} title={product.title} />}

                                <div className={row.imageFirst ? "" : "lg:text-right"}>
                                    <span className="font-mono text-label uppercase tracking-[.16em] text-grey">{product.category}</span>
                                    <Link
                                        href={`/shop/${row.id}`}
                                        className={`mt-2 mb-3 block w-full text-[clamp(20px,2vw,26px)] font-medium text-ink transition-colors after:absolute after:inset-0 after:z-0 hover:text-pink-dark focus-visible:outline-none ${row.imageFirst ? "text-left" : "text-left lg:text-right"}`}
                                    >
                                        {product.title}
                                    </Link>
                                    {product.count > 0 && (
                                        <div className={`mb-4 flex ${row.imageFirst ? "" : "lg:justify-end"}`}>
                                            <StarRating rating={product.rating} count={product.count} />
                                        </div>
                                    )}
                                    <div className={`flex items-center gap-4 ${row.imageFirst ? "" : "lg:justify-end"}`}>
                                        <PriceTag price={product.price} salePrice={product.salePrice} className="font-mono text-small text-ink" />
                                        <button onClick={() => handleAddToBag(row.id)} className="ui-btn ui-btn-primary ui-btn-sm relative z-10">
                                            Add to Bag
                                        </button>
                                    </div>
                                </div>

                                {!row.imageFirst && (
                                    <div className="order-first md:order-none">
                                        <ProductImage id={row.id} aspect={row.aspect} title={product.title} />
                                    </div>
                                )}
                            </div>
                        </RevealIn>
                    );
                })}
            </div>
        </SectionContainer>
    )
}
