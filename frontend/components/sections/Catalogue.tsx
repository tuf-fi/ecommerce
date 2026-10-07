"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Card from "../ui/Card";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { FILTER_SELECT } from "../ui/SearchField";
import { CATEGORIES, PRODUCTS, currentPrice } from "@/library/products";
import { useContent } from "@/library/content";

const PREVIEW_COUNT = 12;

type PriceBucket = "all" | "under" | "mid" | "over";
type RatingFloor = 0 | 4 | 4.5;

export default function Catalogue() {
    const { catalogue, sectionVisibility } = useContent();

    // Category select mirrors /shop's predicate; price/rating filters are local-only refinements /shop doesn't need.
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
    const [priceBucket, setPriceBucket] = useState<PriceBucket>("all");
    const [minRating, setMinRating] = useState<RatingFloor>(0);

    const filtered = useMemo(() => {
        let list = PRODUCTS;
        if (category !== "All") list = list.filter((p) => p.category === category);
        if (priceBucket === "under") list = list.filter((p) => currentPrice(p) < 1500);
        else if (priceBucket === "mid") list = list.filter((p) => currentPrice(p) >= 1500 && currentPrice(p) <= 2500);
        else if (priceBucket === "over") list = list.filter((p) => currentPrice(p) > 2500);
        if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
        return list;
    }, [category, priceBucket, minRating]);

    if (!sectionVisibility.catalogue) return null;

    const visible = filtered.slice(0, PREVIEW_COUNT);

    return (
        <SectionContainer id="products">
            <SectionTitle section="catalogue" title="Shop All" />

            <div className="mb-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:flex sm:flex-wrap md:mb-11">
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
                    className={FILTER_SELECT}
                >
                    <option value="All">Category</option>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                <select value={priceBucket} onChange={(e) => setPriceBucket(e.target.value as PriceBucket)} className={FILTER_SELECT}>
                    <option value="all">All Prices</option>
                    <option value="under">Under ₱1,500</option>
                    <option value="mid">₱1,500 – ₱2,500</option>
                    <option value="over">₱2,500+</option>
                </select>

                <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value) as RatingFloor)}
                    className={FILTER_SELECT}
                >
                    <option value={0}>All Ratings</option>
                    <option value={4}>4★ &amp; up</option>
                    <option value={4.5}>4.5★ &amp; up</option>
                </select>
            </div>

            {visible.length === 0 ? (
                <div className="flex flex-col items-center gap-4 border border-ink/10 py-20 text-center">
                    <p className="max-w-[280px] text-[13px] leading-relaxed text-grey">No products match these filters.</p>
                </div>
            ) : (
                <div id="catalogTop" className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                    {visible.map((product, index) => {
                        // Lead tile gets extra weight, matching BestSellers/Journal/Moments.
                        const featured = index === 0;
                        return (
                            <RevealIn
                                key={product.id}
                                direction="bottom"
                                distance={28}
                                delay={Math.floor(index / 4) * 0.12 + (index % 4) * 0.08}
                                className={featured ? "sm:col-span-2 sm:row-span-2" : undefined}
                            >
                                <Card product={product} size={featured ? "large" : "default"} dense />
                            </RevealIn>
                        );
                    })}
                </div>
            )}

            <RevealIn direction="bottom" delay={0.45} distance={20} className="mt-10 flex justify-center md:mt-14">
                <Link
                    href="/shop"
                    className="group/cta inline-flex w-full items-center justify-center gap-2.5 bg-navy px-8 py-4 sm:w-auto text-[13px] font-semibold uppercase tracking-wide text-white transition hover:bg-pink-dark"
                >
                    {catalogue.ctaLabel}
                    <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                </Link>
            </RevealIn>
        </SectionContainer>
    );
}
