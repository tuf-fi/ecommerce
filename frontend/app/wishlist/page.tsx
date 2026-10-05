"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";
import Pagination from "@/components/ui/Pagination";
import SearchField, { FILTER_SELECT } from "@/components/ui/SearchField";
import { useStore } from "@/library/store";
import { CATEGORIES, getProduct } from "@/library/products";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import PageIntro from "@/components/sections/PageIntro";
import { PageIntroContent } from "@/library/content";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const PAGE_SIZE = 16;

// See ShopPage for why `preview`/`introPreviewData` exist and how the admin's ContentEditorShell scrolls this
// real page (previewScroll="page") instead of clipping it in a small pane — same admin live-preview use case.
export default function WishlistPage({ preview = false, introPreviewData }: { preview?: boolean; introPreviewData?: PageIntroContent } = {}) {
    const { wishlist } = useStore();
    const mounted = useMounted();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
    const [page, setPage] = useState(1);

    // toggleWishlist appends new saves to the end, so reverse to read newest-first.
    const realSaved = wishlist
        .map((id) => getProduct(id))
        .filter((p): p is NonNullable<typeof p> => !!p)
        .slice()
        .reverse();
    const saved = realSaved;

    let products = saved;
    if (category !== "All") products = products.filter((p) => p.category === category);
    if (search.trim()) {
        const q = search.trim().toLowerCase();
        products = products.filter((p) => p.title.toLowerCase().includes(q));
    }

    // Reset to page 1 on filter change; a render-time state adjustment, not an effect.
    const filterKey = `${category}|${search}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    useScrollTopOnChange(currentPage);

    if (!mounted) return <WishlistSkeleton preview={preview} />;

    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : "shadow-glow -mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20"}>
            <PageIntro pageKey="wishlist" previewData={introPreviewData} />

            <SectionTitle num="—" title={`${saved.length} Saved`} />

            {saved.length === 0 ? (
                <div className="flex flex-col items-center gap-5 border border-ink/10 py-20 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-off text-grey">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                    </span>
                    <p className="max-w-[320px] text-[13px] leading-relaxed text-grey">
                        Nothing saved yet. Tap the heart on any product to keep it here.
                    </p>
                    {!preview && (
                        <Link
                            href="/shop"
                            className="border border-ink/15 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                        >
                            Browse the Catalogue
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="mb-8 flex flex-wrap items-center gap-3">
                        <SearchField value={search} onChange={setSearch} placeholder="Search by product name" />
                        <select value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])} className={FILTER_SELECT}>
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    Category: {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {products.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 border border-ink/10 py-20 text-center">
                            <p className="max-w-[280px] text-[13px] leading-relaxed text-grey">No saved items match your search.</p>
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
            )}
        </div>
    );
}

function WishlistSkeleton({ preview = false }: { preview?: boolean } = {}) {
    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : "shadow-glow -mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20"}>
            <SkeletonGroup>
                <Skeleton className="mt-3 h-[34px] w-[70%] max-w-[520px] sm:h-[42px]" />
                <Skeleton className="mt-3 mb-11 h-[34px] w-[45%] max-w-[340px] sm:h-[42px]" />

                <div className="mb-11 flex items-center gap-x-5">
                    <Skeleton className="h-[10.5px] w-3" />
                    <Skeleton className="h-[10.5px] w-16" />
                    <span className="h-px flex-1 bg-grey-light/40" />
                </div>

                <div className="mb-8 flex flex-wrap items-center gap-3">
                    <Skeleton tone="outline" className="h-10 w-64" />
                    <Skeleton tone="outline" className="h-10 w-40" />
                </div>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
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
        </div>
    );
}
