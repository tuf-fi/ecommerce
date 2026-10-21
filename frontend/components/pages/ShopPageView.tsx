"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import { CATEGORIES, PRODUCTS, currentPrice, isOnSale } from "@/library/products";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import PageIntro from "@/components/sections/PageIntro";
import { PageIntroContent, useContent } from "@/library/content";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import FilterDrawer from "@/components/ui/FilterDrawer";
import { BAR_BUTTON } from "@/components/ui/ActionBar";
import EmptyState from "@/components/ui/EmptyState";
import { ASIDE_CLASS, ASIDE_STICKY, FilterColumnSkeleton, HEADER_LABEL, HEADER_ROW, PAGE_COLUMN, SECTION_LABEL, SHELL_GRID, SHELL_WRAPPER, Tick, rowClass } from "@/components/ui/sidebar";

type SortKey = "default" | "price-asc" | "price-desc" | "rating-desc";

const SORT_KEYS: SortKey[] = ["default", "price-asc", "price-desc", "rating-desc"];

const PAGE_SIZE = 16;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "default", label: "Featured" },
    { key: "price-asc", label: "Price, low to high" },
    { key: "price-desc", label: "Price, high to low" },
    { key: "rating-desc", label: "Top rated" },
];

const PRICE_INPUT =
    "h-full min-w-0 flex-1 bg-transparent px-2 text-ink outline-none placeholder:text-grey [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

// `preview`/`introPreviewData`: the admin's Shop-intro editor embeds this real page (via ContentEditorShell's
// previewScroll="page", so the admin page scrolls with it instead of a clipped inner pane) so admins see the intro
// in context against the real search/filter/sort/pagination it sits above — only the intro headline/accent are
// actually editable here. `preview` just drops the bleed trick (the admin's box has no real body padding to cancel).
export default function ShopPageView({ preview = false, introPreviewData }: { preview?: boolean; introPreviewData?: PageIntroContent } = {}) {
    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : SHELL_WRAPPER}>
            <Suspense fallback={<ShopGridSkeleton introPreviewData={introPreviewData} />}>
                <ShopContent preview={preview} introPreviewData={introPreviewData} />
            </Suspense>
        </div>
    );
}

// Reads the URL, so it must sit inside a Suspense boundary or `next build` can't prerender this route.
// Category, sort, search, price range and the sale/stock toggles all live in the query string, so a filtered view survives back-navigation and can be shared.
function ShopContent({ preview, introPreviewData }: { preview: boolean; introPreviewData?: PageIntroContent }) {
    const urlParams = useSearchParams();
    // The admin preview keeps its filters in local state so they never touch the admin page's own URL.
    const [previewQs, setPreviewQs] = useState("");
    const searchParams = preview ? new URLSearchParams(previewQs) : urlParams;
    const router = useRouter();
    const pathname = usePathname();
    const { concerns } = useContent();

    const concernParam = searchParams.get("concern");
    const concernLabel = concernParam ? (concerns.find((c) => c.key === concernParam)?.title ?? concernParam) : null;
    const category = (CATEGORIES.find((c) => c === searchParams.get("category")) ?? "All") as (typeof CATEGORIES)[number];
    const sortParam = searchParams.get("sort");
    const sort = (SORT_KEYS.includes(sortParam as SortKey) ? sortParam : "default") as SortKey;
    const q = searchParams.get("q") ?? "";
    const minParam = searchParams.get("min") ?? "";
    const maxParam = searchParams.get("max") ?? "";
    const onSaleOnly = searchParams.get("sale") === "1";
    const inStockOnly = searchParams.get("stock") === "1";

    const [search, setSearch] = useState(q);
    const [minInput, setMinInput] = useState(minParam);
    const [maxInput, setMaxInput] = useState(maxParam);
    const [page, setPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const setParams = useCallback(
        (updates: Record<string, string | null>) => {
            const next = new URLSearchParams(preview ? previewQs : window.location.search);
            for (const [k, v] of Object.entries(updates)) {
                if (v === null || v === "") next.delete(k);
                else next.set(k, v);
            }
            const qs = next.toString();
            if (preview) setPreviewQs(qs);
            else router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [router, pathname, preview, previewQs]
    );

    // Typing stays local and reaches the URL a beat later, so each keystroke isn't a navigation.
    useEffect(() => {
        const t = setTimeout(() => {
            if (search.trim() !== q) setParams({ q: search.trim() || null });
        }, 300);
        return () => clearTimeout(t);
    }, [search, q, setParams]);
    useEffect(() => {
        const t = setTimeout(() => {
            if (minInput !== minParam || maxInput !== maxParam) setParams({ min: minInput || null, max: maxInput || null });
        }, 500);
        return () => clearTimeout(t);
    }, [minInput, maxInput, minParam, maxParam, setParams]);

    const min = minParam === "" || Number.isNaN(Number(minParam)) ? null : Number(minParam);
    const max = maxParam === "" || Number.isNaN(Number(maxParam)) ? null : Number(maxParam);

    const filtered = useMemo(() => {
        let list = PRODUCTS;
        if (category !== "All") list = list.filter((p) => p.category === category);
        if (concernParam) list = list.filter((p) => p.concerns?.includes(concernParam));
        if (q.trim()) {
            const needle = q.trim().toLowerCase();
            list = list.filter((p) => `${p.title} ${p.category} ${p.desc}`.toLowerCase().includes(needle));
        }
        if (min !== null) list = list.filter((p) => currentPrice(p) >= min);
        if (max !== null) list = list.filter((p) => currentPrice(p) <= max);
        if (onSaleOnly) list = list.filter((p) => isOnSale(p) || !!p.sizes?.some(isOnSale));
        if (inStockOnly) list = list.filter((p) => p.stock > 0);
        const sorted = [...list];
        switch (sort) {
            case "price-asc":
                sorted.sort((a, b) => currentPrice(a) - currentPrice(b));
                break;
            case "price-desc":
                sorted.sort((a, b) => currentPrice(b) - currentPrice(a));
                break;
            case "rating-desc":
                sorted.sort((a, b) => b.rating - a.rating);
                break;
        }
        return sorted;
    }, [category, q, sort, concernParam, min, max, onSaleOnly, inStockOnly]);

    // Reset to page 1 on filter change; a render-time state adjustment, not an effect.
    const filterKey = `${category}|${q}|${sort}|${concernParam}|${minParam}|${maxParam}|${onSaleOnly}|${inStockOnly}`;
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

    // Counts respect the chosen category, so a concern never promises products the list won't show.
    const concernCounts = useMemo(() => {
        const base = category === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
        return Object.fromEntries(concerns.map((c) => [c.key, base.filter((p) => p.concerns?.includes(c.key)).length]));
    }, [concerns, category]);

    const chips: { key: string; label: string; clear: Record<string, string | null> }[] = [];
    if (category !== "All") chips.push({ key: "category", label: category, clear: { category: null } });
    if (concernLabel) chips.push({ key: "concern", label: concernLabel, clear: { concern: null } });
    if (q.trim()) chips.push({ key: "q", label: `“${q.trim()}”`, clear: { q: null } });
    if (min !== null || max !== null) chips.push({ key: "price", label: `₱${min ?? 0}${max !== null ? `–₱${max}` : "+"}`, clear: { min: null, max: null } });
    if (onSaleOnly) chips.push({ key: "sale", label: "On sale", clear: { sale: null } });
    if (inStockOnly) chips.push({ key: "stock", label: "In stock", clear: { stock: null } });

    function clearAll() {
        setSearch("");
        setMinInput("");
        setMaxInput("");
        setParams({ category: null, concern: null, q: null, min: null, max: null, sale: null, stock: null });
    }

    function removeChip(clear: Record<string, string | null>) {
        if ("q" in clear) setSearch("");
        if ("min" in clear) {
            setMinInput("");
            setMaxInput("");
        }
        setParams(clear);
    }

    const heading = `${filtered.length} ${category === "All" ? (filtered.length === 1 ? "Product" : "Products") : category}`;

    const renderPanel = (showHeader: boolean) => (
        <div className="flex flex-col gap-6">
            {showHeader && (
                <div className={HEADER_ROW}>
                    <span className={HEADER_LABEL}>Filters</span>
                    {chips.length > 0 && (
                        <button onClick={clearAll} className="text-meta text-grey underline underline-offset-4 transition hover:text-ink">
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {chips.length > 0 && (
                <div>
                    <span className={SECTION_LABEL}>Applied</span>
                    <ul className="flex flex-col gap-px">
                        {chips.map((chip) => (
                            <li key={chip.key}>
                                <button onClick={() => removeChip(chip.clear)} aria-label={`Remove filter ${chip.label}`} className={rowClass(true)}>
                                    {chip.label}
                                    <span aria-hidden className="text-body leading-none">
                                        ×
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <SearchField value={search} onChange={setSearch} placeholder="Name or ingredient" />

            <div>
                <span className={SECTION_LABEL}>Sort</span>
                <ul className="flex flex-col gap-px">
                    {SORT_OPTIONS.map((o) => (
                        <li key={o.key}>
                            <button onClick={() => setParams({ sort: o.key === "default" ? null : o.key })} aria-pressed={sort === o.key} className={rowClass(sort === o.key)}>
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
                                <button onClick={() => setParams({ category: c === "All" ? null : c })} aria-pressed={active} className={rowClass(active)}>
                                    {c}
                                    <span className={`font-mono text-label ${active ? "text-pink-dark" : "text-grey"}`}>{categoryCounts[c]}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {concerns.length > 0 && (
                <div>
                    <span className={SECTION_LABEL}>Concern</span>
                    <ul className="flex flex-col gap-px">
                        {[{ key: "", title: "All" }, ...concerns].map((c) => {
                            const active = (concernParam ?? "") === c.key;
                            const count = c.key === "" ? null : concernCounts[c.key];
                            return (
                                <li key={c.key || "all"}>
                                    <button onClick={() => setParams({ concern: c.key || null })} aria-pressed={active} className={rowClass(active)}>
                                        {c.title}
                                        {count !== null && <span className={`font-mono text-label ${active ? "text-pink-dark" : "text-grey"}`}>{count}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <div>
                <span className={SECTION_LABEL}>Price range</span>
                <div className="grid grid-cols-2 gap-2 px-3">
                    {[
                        { label: "From", value: minInput, set: setMinInput, placeholder: "0", aria: "Minimum price" },
                        { label: "To", value: maxInput, set: setMaxInput, placeholder: "No limit", aria: "Maximum price" },
                    ].map((f) => (
                        <label key={f.label} className="block">
                            <span className="mb-1 block text-label text-grey">{f.label}</span>
                            <span className="flex h-10 items-center border border-ink/10 bg-off/50 font-mono text-meta text-ink transition focus-within:border-navy/30 focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-1">
                                <span aria-hidden className="pl-3 text-grey">₱</span>
                                <input type="number" inputMode="numeric" min={0} value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} aria-label={f.aria} className={PRICE_INPUT} />
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <span className={SECTION_LABEL}>Availability</span>
                <ul className="flex flex-col gap-px">
                    <li>
                        <button onClick={() => setParams({ sale: onSaleOnly ? null : "1" })} aria-pressed={onSaleOnly} className={rowClass(onSaleOnly)}>
                            On sale
                            {onSaleOnly && <Tick />}
                        </button>
                    </li>
                    <li>
                        <button onClick={() => setParams({ stock: inStockOnly ? null : "1" })} aria-pressed={inStockOnly} className={rowClass(inStockOnly)}>
                            In stock
                            {inStockOnly && <Tick />}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className={preview ? "grid grid-cols-1 lg:grid-cols-[260px_1fr]" : SHELL_GRID}>
            <aside className={preview ? "hidden pr-6 lg:block" : ASIDE_CLASS}>
                <div className={preview ? "" : ASIDE_STICKY}>{renderPanel(true)}</div>
            </aside>

            <div className={preview ? "min-w-0" : PAGE_COLUMN}>
                <PageIntro pageKey="shop" previewData={introPreviewData} rule={false} />
                <SectionTitle
                    num="—"
                    title={heading}
                    action={
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex h-11 flex-none items-center gap-2 border border-ink/10 bg-off/50 px-3.5 text-meta normal-case tracking-normal text-ink transition hover:border-ink/30 lg:hidden"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                                <circle cx="16" cy="7" r="2" />
                                <circle cx="8" cy="17" r="2" />
                            </svg>
                            Filters
                            {chips.length > 0 && <span className="font-mono text-label text-pink-dark">{chips.length}</span>}
                        </button>
                    }
                />

                {filtered.length === 0 ? (
                    <EmptyState
                        title={chips.length > 0 ? "No matches" : "Nothing here yet"}
                        message={chips.length > 0 ? "Nothing matches these filters. Loosen one, or start again." : "The catalogue is empty right now."}
                        action={
                            chips.length > 0 ? (
                                <button onClick={clearAll} className="ui-btn ui-btn-secondary">
                                    Clear all filters
                                </button>
                            ) : undefined
                        }
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                            {paged.map((product) => (
                                <Card key={product.id} product={product} dense />
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
                        {chips.length > 0 && (
                            <button onClick={clearAll} className="h-11 px-2 text-meta text-grey underline underline-offset-4 transition hover:text-ink">
                                Clear all
                            </button>
                        )}
                        <button onClick={() => setDrawerOpen(false)} className={`${BAR_BUTTON} ml-auto`}>
                            Show {filtered.length} result{filtered.length === 1 ? "" : "s"}
                        </button>
                    </div>
                }
            >
                {renderPanel(false)}
            </FilterDrawer>
        </div>
    );
}

function ShopGridSkeleton({ introPreviewData }: { introPreviewData?: PageIntroContent }) {
    return (
        <SkeletonGroup>
            <div className={SHELL_GRID}>
                <FilterColumnSkeleton groups={[4, CATEGORIES.length]} />

                <div className={PAGE_COLUMN}>
                    <PageIntro pageKey="shop" previewData={introPreviewData} rule={false} />
                    <div className="mb-8 flex items-center gap-x-4 sm:gap-x-5">
                        <Skeleton className="h-[10.5px] w-3" />
                        <Skeleton className="h-[10.5px] w-24" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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
    );
}
