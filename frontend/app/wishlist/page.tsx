"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";
import Pagination from "@/components/ui/Pagination";
import SearchField, { FILTER_SELECT } from "@/components/ui/SearchField";
import LoginRequiredModal from "@/components/modals/LoginRequiredModal";
import { useStore } from "@/library/store";
import { CATEGORIES, getProduct } from "@/library/products";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import { useContent } from "@/library/content";

const PAGE_SIZE = 16;

export default function WishlistPage() {
    const { wishlist, isLoggedIn, openModal } = useStore();
    const { pageIntros } = useContent();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
    const [page, setPage] = useState(1);

    // Newest saved first — toggleWishlist appends new saves to the end of
    // the array, so reverse it to read most-recent-first.
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

    // Reset to page 1 whenever the filter set changes — a render-time state
    // adjustment rather than an effect.
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

    if (!isLoggedIn) {
        return (
            <>
                <div className="min-h-screen bg-white" />
                <LoginRequiredModal
                    open
                    message="You need to be signed in to view your wishlist."
                    onLogin={() => openModal("login")}
                    onCancel={() => router.push("/")}
                />
            </>
        );
    }

    return (
        <div className="shadow-glow -mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            {/* <span className="eyebrow uppercase text-grey">Saved For Later</span> */}
            <h1 className="mt-3 mb-11 max-w-none text-[30px] leading-[1.08] font-normal sm:text-[38px] lg:text-[42px]">
                {pageIntros.wishlist.headline} <br/><em className="pink-highlight font-normal">{pageIntros.wishlist.accent}</em>
            </h1>

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
                    <Link
                        href="/shop"
                        className="border border-ink/15 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                    >
                        Browse the Catalogue
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mb-8 flex flex-wrap items-center gap-2.5">
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
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
