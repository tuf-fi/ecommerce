"use client";

import Card from "@/components/ui/Card";
import { PRODUCTS, type Product } from "@/library/products";

// A short row of products: top-rated and in stock by default (under an empty bag or wishlist), or whatever `products` supplies.
export default function EmptyPicks({ title = "Start with these", products }: { title?: string; products?: Product[] }) {
    const picks = products ?? PRODUCTS.filter((p) => p.stock > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
    if (picks.length === 0) return null;
    return (
        <section className="mt-14">
            <span className="mb-6 block font-mono text-label uppercase tracking-[.16em] text-grey">{title}</span>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {picks.map((product) => (
                    <Card key={product.id} product={product} dense />
                ))}
            </div>
        </section>
    );
}
