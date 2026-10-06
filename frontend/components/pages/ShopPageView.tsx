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
import { PageIntroContent, useContent } from "@/library/content";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

type SortKey = "default" | "price-asc" | "price-desc" | "rating-desc";

const PAGE_SIZE = 16;

// `preview`/`introPreviewData`: the admin's Shop-intro editor embeds this real page (via ContentEditorShell's
// previewScroll="page", so the admin page scrolls with it instead of a clipped inner pane) so admins see the intro
// in context against the real search/filter/sort/pagination it sits above — only the intro headline/accent are
// actually editable here. `preview` just drops the bleed trick (the admin's box has no real body padding to cancel).
export default function ShopPageView({ preview = false, introPreviewData }: { preview?: boolean; introPreviewData?: PageIntroContent } = {}) {
    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : "shadow-glow -mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+1.2rem)] pb-20"}>
            <PageIntro pageKey="shop" previewData={introPreviewData} />
            <Suspense fallback={<ShopGridSkeleton />}>
                <ShopContent />
            </Suspense>
        </div>
    );
}

// Reads the URL (`?concern=`), so it must sit inside a Suspense boundary or `next build` can't prerender this route.
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

    // Reset to page 1 on filter change; a render-time state adjustment, not an effect.
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

    const categoryCounts = useMemo(() => {
        const base = concernParam ? PRODUCTS.filter((p) => p.concerns?.includes(concernParam)) : PRODUCTS;
        const counts = {} as Record<(typeof CATEGORIES)[number], number>;
        for (const c of CATEGORIES) counts[c] = c === "All" ? base.length : base.filter((p) => p.category === c).length;
        return counts;
    }, [concernParam]);

    // Filters live in a persistent sidebar column, not a row that scrolls away.
    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
            <aside className="flex flex-col gap-6 lg:gap-8 lg:sticky lg:top-[calc(var(--navbar-h,72px)+24px)] lg:self-start">
                <SearchField value={search} onChange={setSearch} placeholder="Search products" />

                <div>
                    <span className="mb-3 block font-mono text-[10.5px] uppercase tracking-[.16em] text-grey">Category</span>
                    <ul className="thin-scrollbar -mx-1 flex flex-row gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:p-0">
                        {CATEGORIES.map((c) => {
                            const active = category === c;
                            return (
                                <li key={c} className="flex-none">
                                    <button
                                        onClick={() => setCategory(c)}
                                        className={`flex w-full items-center justify-between gap-3 whitespace-nowrap border-b-2 py-2.5 pl-3 pr-3 text-left text-[13px] transition lg:border-b-0 lg:border-l-2 lg:pl-4 ${
                                            active ? "border-pink-btn bg-pink-soft/40 font-medium text-pink-dark" : "border-transparent text-ink hover:border-ink/15 hover:bg-off/60"
                                        }`}
                                    >
                                        {c}
                                        <span className={`font-mono text-[11px] ${active ? "text-pink-dark" : "text-grey"}`}>{categoryCounts[c]}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {concernLabel && (
                    <div>
                        <span className="mb-3 block font-mono text-[10.5px] uppercase tracking-[.16em] text-grey">Concern</span>
                        <Link
                            href="/shop"
                            className="flex items-center gap-1.5 border border-ink/15 bg-off/50 px-3 py-2 text-[12px] font-medium text-ink transition hover:border-pink-btn hover:text-pink-dark"
                        >
                            {concernLabel}
                            <span aria-hidden>×</span>
                        </Link>
                    </div>
                )}
            </aside>

            <div className="min-w-0">
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SectionTitle num="—" title={`${filtered.length} Products`} />
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${FILTER_SELECT} flex-none`}>
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
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {paged.map((product) => (
                                <Card key={product.id} product={product} />
                            ))}
                        </div>

                        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                    </>
                )}
            </div>
        </div>
    );
}

function ShopGridSkeleton() {
    return (
        <SkeletonGroup>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
                <div className="flex flex-col gap-8">
                    <Skeleton tone="outline" className="h-11 w-full" />
                    <div className="flex flex-col gap-3">
                        <Skeleton tone="soft" className="h-[10px] w-16" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="mb-8 flex items-center justify-between gap-x-5">
                        <div className="flex items-center gap-x-5">
                            <Skeleton className="h-[10.5px] w-3" />
                            <Skeleton className="h-[10.5px] w-24" />
                        </div>
                        <Skeleton tone="outline" className="h-11 w-40" />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                </div>
            </div>
        </SkeletonGroup>
    );
}
