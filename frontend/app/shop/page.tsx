"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";
import Pagination from "@/components/ui/Pagination";
import SearchField, { FILTER_SELECT } from "@/components/ui/SearchField";
import { CATEGORIES, PRODUCTS } from "@/library/products";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import { useContent } from "@/library/content";

type SortKey = "default" | "price-asc" | "price-desc" | "rating-desc";

const PAGE_SIZE = 16;

export default function ShopPage() {
    const { pageIntros } = useContent();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
    const [sort, setSort] = useState<SortKey>("default");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let list = PRODUCTS;
        if (category !== "All") list = list.filter((p) => p.category === category);
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
    }, [category, search, sort]);

    // Reset to page 1 whenever the filter set changes — a render-time state
    // adjustment rather than an effect.
    const filterKey = `${category}|${search}|${sort}`;
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
        <div className="shadow-glow -mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            {/* <span className="eyebrow uppercase text-grey">Full Catalogue</span> */}
            <h1 className="mt-3 mb-11 max-w-none text-[30px] leading-[1.08] font-normal sm:text-[38px] lg:text-[42px]">
                {pageIntros.shop.headline} <br/><em className="pink-highlight font-normal">{pageIntros.shop.accent}</em>
            </h1>

            <SectionTitle num="—" title={`${filtered.length} Products`} />

            <div className="mb-8 flex flex-wrap items-center gap-2.5">
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
                    <div className="grid grid-cols-4 gap-5">
                        {paged.map((product) => (
                            <Card key={product.id} product={product} />
                        ))}
                    </div>

                    <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                </>
            )}
        </div>
    );
}
