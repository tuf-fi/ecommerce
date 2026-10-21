"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import { useStore } from "@/library/store";
import { CATEGORIES, currentPrice, getProduct, type Product } from "@/library/products";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import PageIntro from "@/components/sections/PageIntro";
import { PageIntroContent } from "@/library/content";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import EmptyPicks from "@/components/ui/EmptyPicks";
import EmptyState from "@/components/ui/EmptyState";
import FilterDrawer from "@/components/ui/FilterDrawer";
import { BAR_BUTTON } from "@/components/ui/ActionBar";
import { ASIDE_CLASS, ASIDE_STICKY, FilterColumnSkeleton, HEADER_LABEL, HEADER_ROW, PAGE_COLUMN, SECTION_LABEL, SHELL_GRID, SHELL_WRAPPER, rowClass } from "@/components/ui/sidebar";

const PAGE_SIZE = 16;

function badgeFor(product: Product, meta?: { price: number; soldOut: boolean }) {
    if (!meta || product.stock <= 0) return undefined;
    if (meta.soldOut) return "Back in stock";
    if (currentPrice(product) < meta.price) return "Price dropped";
    return undefined;
}

type SortKey = "newest" | "oldest" | "price-asc" | "price-desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "newest", label: "Newest saved" },
    { key: "oldest", label: "Oldest saved" },
    { key: "price-asc", label: "Price, low to high" },
    { key: "price-desc", label: "Price, high to low" },
];

const GRID = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 2xl:grid-cols-4";

// See ShopPage for why `preview`/`introPreviewData` exist and how the admin's ContentEditorShell scrolls this
// real page (previewScroll="page") instead of clipping it in a small pane — same admin live-preview use case.
export default function WishlistPageView({ preview = false, introPreviewData }: { preview?: boolean; introPreviewData?: PageIntroContent } = {}) {
    const { wishlist, wishlistMeta, addManyToCart } = useStore();
    const mounted = useMounted();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
    const [sort, setSort] = useState<SortKey>("newest");
    const [page, setPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // toggleWishlist appends new saves to the end, so reverse to read newest-first.
    const saved = wishlist
        .map((id) => getProduct(id))
        .filter((p): p is NonNullable<typeof p> => !!p)
        .slice()
        .reverse();

    let products = saved;
    if (category !== "All") products = products.filter((p) => p.category === category);
    if (search.trim()) {
        const q = search.trim().toLowerCase();
        products = products.filter((p) => p.title.toLowerCase().includes(q));
    }

    if (sort === "oldest") products = [...products].reverse();
    else if (sort === "price-asc") products = [...products].sort((a, b) => currentPrice(a) - currentPrice(b));
    else if (sort === "price-desc") products = [...products].sort((a, b) => currentPrice(b) - currentPrice(a));

    // Reset to page 1 on filter change; a render-time state adjustment, not an effect.
    const filterKey = `${category}|${search}|${sort}`;
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

    const activeFilters = (search.trim() ? 1 : 0) + (category !== "All" ? 1 : 0) + (sort !== "newest" ? 1 : 0);

    function clearAll() {
        setSearch("");
        setCategory("All");
        setSort("newest");
    }

    const counts = (c: (typeof CATEGORIES)[number]) => (c === "All" ? saved.length : saved.filter((p) => p.category === c).length);

    const renderPanel = (showHeader: boolean) => (
        <div className="flex flex-col gap-6">
            {showHeader && (
                <div className={HEADER_ROW}>
                    <span className={HEADER_LABEL}>Filters</span>
                    {activeFilters > 0 && (
                        <button onClick={clearAll} className="text-meta text-grey underline underline-offset-4 transition hover:text-ink">
                            Clear all
                        </button>
                    )}
                </div>
            )}

            <SearchField value={search} onChange={setSearch} placeholder="Product name" />

            <div>
                <span className={SECTION_LABEL}>Sort</span>
                <ul className="flex flex-col gap-px">
                    {SORT_OPTIONS.map((o) => (
                        <li key={o.key}>
                            <button onClick={() => setSort(o.key)} aria-pressed={sort === o.key} className={rowClass(sort === o.key)}>
                                {o.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <span className={SECTION_LABEL}>Category</span>
                <ul className="flex flex-col gap-px">
                    {CATEGORIES.map((c) => {
                        const active = category === c;
                        return (
                            <li key={c}>
                                <button onClick={() => setCategory(c)} aria-pressed={active} className={rowClass(active)}>
                                    {c}
                                    <span className={`font-mono text-label ${active ? "text-pink-dark" : "text-grey"}`}>{counts(c)}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );

    const intro = <PageIntro pageKey="wishlist" previewData={introPreviewData} rule={false} />;

    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : SHELL_WRAPPER}>
            {saved.length === 0 ? (
                <div className={preview ? "" : `${PAGE_COLUMN} border-t border-ink/10`}>
                    {intro}
                    <SectionTitle num="—" title="0 Saved" />

<EmptyState
                        title="Nothing saved yet"
                        message="Tap the heart on any product to keep it here."
                        action={!preview ? { label: "Browse the catalogue", href: "/shop" } : undefined}
                    />
                    {!preview && <EmptyPicks title="Worth saving" />}
                </div>
            ) : (
                <div className={preview ? "grid grid-cols-1 lg:grid-cols-[260px_1fr]" : SHELL_GRID}>
                    <aside className={preview ? "hidden pr-6 lg:block" : ASIDE_CLASS}>
                        <div className={preview ? "" : ASIDE_STICKY}>{renderPanel(true)}</div>
                    </aside>

                    <div className={preview ? "min-w-0" : PAGE_COLUMN}>
                        {intro}

                        <SectionTitle
                            num="—"
                            title={`${saved.length} Saved`}
                            action={
                                <div className="flex items-center gap-2 normal-case tracking-normal">
                                    <button
                                        onClick={() => setDrawerOpen(true)}
                                        className="flex h-11 flex-none items-center gap-2 border border-ink/10 bg-off/50 px-3.5 text-meta text-ink transition hover:border-ink/30 lg:hidden"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                                            <circle cx="16" cy="7" r="2" />
                                            <circle cx="8" cy="17" r="2" />
                                        </svg>
                                        Filters
                                        {activeFilters > 0 && <span className="font-mono text-label text-pink-dark">{activeFilters}</span>}
                                    </button>
                                    {!preview && (
                                        <button
                                            onClick={() => addManyToCart(saved.map((p) => p.id))}
                                            className="ui-btn ui-btn-secondary ui-btn-sm flex-none"
                                        >
                                            Add all to bag
                                        </button>
                                    )}
                                </div>
                            }
                        />

                        {products.length === 0 ? (
                            <EmptyState
                                title="No matches"
                                message="Nothing saved matches these filters."
                                action={
                                    <button onClick={clearAll} className="ui-btn ui-btn-secondary">
                                        Clear all filters
                                    </button>
                                }
                            />
                        ) : (
                            <>
                                <div className={GRID}>
                                    {paged.map((product) => (
                                        <Card key={product.id} product={product} dense badge={badgeFor(product, wishlistMeta[product.id])} />
                                    ))}
                                </div>

                                <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                            </>
                        )}
                    </div>

                    <FilterDrawer
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        footer={
                            <div className="flex items-center gap-3">
                                {activeFilters > 0 && (
                                    <button onClick={clearAll} className="h-11 px-2 text-meta text-grey underline underline-offset-4 transition hover:text-ink">
                                        Clear all
                                    </button>
                                )}
                                <button onClick={() => setDrawerOpen(false)} className={`${BAR_BUTTON} ml-auto`}>
                                    Show {products.length} item{products.length === 1 ? "" : "s"}
                                </button>
                            </div>
                        }
                    >
                        {renderPanel(false)}
                    </FilterDrawer>
                </div>
            )}
        </div>
    );
}

function WishlistSkeleton({ preview = false }: { preview?: boolean } = {}) {
    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : SHELL_WRAPPER}>
            <SkeletonGroup>
                <div className={preview ? "" : SHELL_GRID}>
                    {!preview && <FilterColumnSkeleton groups={[4, CATEGORIES.length]} />}

                    <div className={preview ? "" : PAGE_COLUMN}>
                        <div className="mb-10 pt-[1.2rem] md:mb-14">
                            <Skeleton className="mb-8 h-[10.5px] w-20 md:mb-10" />
                            <Skeleton className="h-[34px] w-[70%] max-w-[520px] sm:h-[42px]" />
                            <Skeleton className="mt-3 h-[34px] w-[45%] max-w-[340px] sm:h-[42px]" />
                        </div>

                        <div className="mb-8 flex items-center gap-x-4 sm:gap-x-5 md:mb-11">
                            <Skeleton className="h-[10.5px] w-3" />
                            <Skeleton className="h-[10.5px] w-16" />
                            <span className="h-px flex-1 bg-grey-light/40" />
                        </div>

                        <div className={GRID}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex flex-col border border-ink/10">
                                    <Skeleton tone="faint" className="aspect-[4/5] w-full" />
                                    <div className="flex flex-col gap-1.5 p-3 sm:gap-2 sm:p-5">
                                        <Skeleton className="h-[10px] w-16" />
                                        <Skeleton className="h-[14px] w-4/5 sm:h-[16.5px]" />
                                        <Skeleton tone="soft" className="mb-2 h-[14px] w-24" />
                                        <div className="flex flex-col items-stretch gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-x-3 sm:pt-3">
                                            <Skeleton className="h-[13px] w-12" />
                                            <Skeleton tone="outline" className="h-[37px] w-full sm:h-[35px] sm:w-24" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SkeletonGroup>
        </div>
    );
}
