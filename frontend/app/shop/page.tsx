"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";
import Pagination from "@/components/ui/Pagination";
import SearchField, { FILTER_SELECT } from "@/components/ui/SearchField";
import { CATEGORIES, PRODUCTS } from "@/library/products";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import PageIntro from "@/components/sections/PageIntro";
import { useContent } from "@/library/content";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

type SortKey = "default" | "price-asc" | "price-desc" | "rating-desc";

const PAGE_SIZE = 16;

export default function ShopPage() {
    return (
        <div className="shadow-glow -mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <PageIntro pageKey="shop" />
            <Suspense fallback={<ShopGridSkeleton />}>
                <ShopContent />
            </Suspense>
        </div>
    );
}

// Reads the URL (`?concern=`), so it must sit inside a Suspense boundary —
// otherwise `next build` can't statically prerender this route at all.
function ShopContent() {
    const searchParams = useSearchParams();
    const concernParam = searchParams.get("concern");
    const { concerns } = useContent();
    const concernLabel = concernParam ? (concerns.find((c) => c.key === concernParam)?.title ?? concernParam) : null;

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
    const [sort, setSort] = useState<SortKey>("default");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let list = PRODUCTS;
        if (category !== "All") list = list.filter((p) => p.category === category);
        if (concernParam) list = list.filter((p) => p.concerns?.includes(concernParam));
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((p) => p.title.toLowerCase().includes(q));
        }
        const sorted = [...list];
        switch (sort) {
            case "price-asc":
                sorted.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                sorted.sort((a, b) => b.price - a.price);
                break;
            case "rating-desc":
                sorted.sort((a, b) => b.rating - a.rating);
                break;
        }
        return sorted;
    }, [category, search, sort, concernParam]);

    // Reset to page 1 whenever the filter set changes — a render-time state
    // adjustment rather than an effect.
    const filterKey = `${category}|${search}|${sort}|${concernParam}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    useScrollTopOnChange(currentPage);

    return (
        <>
            <SectionTitle num="—" title={`${filtered.length} Products`} />

            {concernLabel && (
                <div className="mb-5 flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[.1em] text-grey">Filtered by concern:</span>
                    <Link
                        href="/shop"
                        className="flex items-center gap-1.5 border border-ink/15 bg-off/50 px-3 py-1.5 text-[12px] font-medium text-ink transition hover:border-pink-btn hover:text-pink-dark"
                    >
                        {concernLabel}
                        <span aria-hidden>×</span>
                    </Link>
                </div>
            )}

            <div className="mb-8 flex flex-wrap items-center gap-3">
                <SearchField value={search} onChange={setSearch} placeholder="Search by product name" />
                <select value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])} className={FILTER_SELECT}>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                            Category: {c}
                        </option>
                    ))}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={FILTER_SELECT}>
                    <option value="default">Sort: Featured</option>
                    <option value="price-asc">Price (Low–High)</option>
                    <option value="price-desc">Price (High–Low)</option>
                    <option value="rating-desc">Rating (High–Low)</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 border border-ink/10 py-20 text-center">
                    <p className="max-w-[280px] text-[13px] leading-relaxed text-grey">No products match your search.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                        {paged.map((product) => (
                            <Card key={product.id} product={product} />
                        ))}
                    </div>

                    <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                </>
            )}
        </>
    );
}

// Mirrors SectionTitle + filter row + Card's shape (border-ink/10, aspect-[4/5]
// image, category/title/rating/price lines) so the boundary swap is invisible
// rather than a layout jump.
function ShopGridSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-11 flex items-center gap-x-5">
                <Skeleton className="h-[10.5px] w-3" />
                <Skeleton className="h-[10.5px] w-24" />
                <span className="h-px flex-1 bg-grey-light/40" />
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-3">
                <Skeleton tone="outline" className="h-10 w-64" />
                <Skeleton tone="outline" className="h-10 w-40" />
                <Skeleton tone="outline" className="h-10 w-44" />
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={i} className="flex flex-col border border-ink/10">
                        <Skeleton tone="faint" className="aspect-[4/5] w-full" />
                        <div className="flex flex-col gap-2 p-5">
                            <Skeleton className="h-[10px] w-16" />
                            <Skeleton className="h-[16.5px] w-4/5" />
                            <Skeleton tone="soft" className="h-3 w-24" />
                            <div className="mt-2 flex items-center justify-between">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton tone="outline" className="h-8 w-24" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </SkeletonGroup>
    );
}
