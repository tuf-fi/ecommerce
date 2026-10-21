"use client";

import Link from "next/link";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { PRODUCTS } from "@/library/products";
import { useContent } from "@/library/content";

const PREVIEW_COUNT = 12;

export default function Catalogue() {
    const { catalogue, sectionVisibility } = useContent();

    if (!sectionVisibility.catalogue) return null;

    const visible = PRODUCTS.slice(0, PREVIEW_COUNT);

    return (
        <SectionContainer id="products">
            <SectionTitle animate section="catalogue" title="Shop All" />

            {visible.length === 0 ? (
                <EmptyState title="No products yet" message="Check back soon." />
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
                    className="ui-btn ui-btn-primary ui-btn-lg group/cta w-full sm:w-auto"
                >
                    {catalogue.ctaLabel}
                    <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                </Link>
            </RevealIn>
        </SectionContainer>
    );
}
