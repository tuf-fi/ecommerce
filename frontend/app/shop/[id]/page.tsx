"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useStore } from "@/library/store";
import { PRODUCTS, getProduct, cheapestSizeId, Product } from "@/library/products";
import PriceTag from "@/components/ui/PriceTag";
import type { Review } from "@/library/reviews";
import { listProductReviews } from "@/library/api/reviews";
import StarRating from "@/components/ui/StarRating";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import Pagination from "@/components/ui/Pagination";
import ReviewModal from "@/components/modals/ReviewModal";

const REVIEWS_PAGE_SIZE = 10;
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

function initials(name: string) {
    if (!name.trim()) return "?";
    return name.trim().slice(0, 2).toUpperCase();
}

export default function ProductPage() {
    const { id } = useParams<{ id: string }>();
    const product = getProduct(Number(id));

    if (!product) {
        return (
            <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-25 pb-20 text-center">
                <p className="text-[13px] text-grey">
                    That product doesn&apos;t exist.{" "}
                    <Link href="/shop" className="text-pink-dark underline">
                        Back to Shop
                    </Link>
                </p>
            </div>
        );
    }

    return <ProductPageContent key={product.id} product={product} />;
}

function ProductPageContent({ product }: { product: Product }) {
    const { addToCart, wishlist, toggleWishlist, isLoggedIn, openModal, showToast } = useStore();
    const [qty, setQty] = useState(1);
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(() => cheapestSizeId(product));
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);

    useEffect(() => {
        let stale = false;
        listProductReviews(product.id)
            .then(({ reviews: list }) => !stale && setReviews(list))
            .catch(() => {
                // Reviews are supplementary; the page works without them.
            })
            .finally(() => !stale && setReviewsLoaded(true));
        return () => {
            stale = true;
        };
    }, [product.id]);
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
    const [reviewPage, setReviewPage] = useState(1);

    const isWished = wishlist.includes(product.id);
    const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);
    const selectedSize = product.sizes?.find((s) => s.id === selectedSizeId);
    const priceSource = selectedSize ?? product;
    const outOfStock = !!selectedSize && selectedSize.stock <= 0;

    const total = reviews.length;
    const avgRating = total ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : product.rating;
    const countByStar = useMemo(() => {
        const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((r) => {
            const n = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
            if (counts[n] !== undefined) counts[n]++;
        });
        return counts;
    }, [reviews]);

    const filteredReviews = ratingFilter === "all" ? reviews : reviews.filter((r) => Math.round(r.rating) === ratingFilter);

    // Reset to page 1 on filter change; a render-time state adjustment, not an effect.
    const filterKey = `${ratingFilter}|${total}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setReviewPage(1);
    }

    const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PAGE_SIZE));
    const currentReviewPage = Math.min(reviewPage, totalReviewPages);
    const pagedReviews = filteredReviews.slice(
        (currentReviewPage - 1) * REVIEWS_PAGE_SIZE,
        currentReviewPage * REVIEWS_PAGE_SIZE
    );

    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-25 pb-20">
            <Link href="/shop" className="mb-8 inline-block text-[12.5px] font-medium text-grey hover:text-pink-dark">
                ← Shop
            </Link>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
                <div className="group relative aspect-[4/5] overflow-hidden border border-ink/10 lg:sticky lg:top-[calc(var(--navbar-h,72px)+24px)] lg:self-start">
                    <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <button
                        aria-label="Toggle wishlist"
                        onClick={() => toggleWishlist(product.id)}
                        className={`absolute top-4 right-4 flex h-11 w-11 items-center justify-center border transition hover:border-pink-btn hover:bg-pink-btn hover:text-white ${
                            isWished ? "border-pink-btn bg-pink-btn text-white" : "border-ink/10 bg-white/90 text-ink"
                        }`}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                    </button>
                </div>

                {/* Two clusters — identity and purchase — separated by one gap and rule, not a shared mt-* scale. */}
                <div className="flex flex-col">
                    <div className="flex flex-col gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{product.category}</span>
                        <h1 className="text-[clamp(24px,3vw,34px)] font-medium leading-tight text-ink">{product.title}</h1>

                        <button
                            onClick={() => {
                                if (!isLoggedIn) {
                                    showToast("error", "Sign in to write a review.");
                                    openModal("login");
                                    return;
                                }
                                setReviewOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <StarRating rating={avgRating} count={total || product.count} />
                            <span className="text-[11px] text-pink-dark underline underline-offset-2">Write a review</span>
                        </button>

                        <PriceTag price={priceSource.price} salePrice={priceSource.salePrice} className="block font-mono text-lg text-ink" />

                        <p className="mt-2 max-w-[440px] text-sm leading-relaxed text-grey">{product.desc}</p>
                    </div>

                    <div className="my-6 h-px w-full max-w-[300px] sm:my-8 bg-ink/10" />

                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between sm:max-w-[300px]">
                            <span className="font-mono text-[11px] uppercase tracking-wide text-grey">Quantity</span>
                            <div className="flex items-center border border-ink/15">
                                <button
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    aria-label="Decrease quantity"
                                    className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-off"
                                >
                                    –
                                </button>
                                <span className="w-8 text-center text-sm text-ink">{qty}</span>
                                <button
                                    onClick={() => setQty((q) => q + 1)}
                                    aria-label="Increase quantity"
                                    className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-off"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {product.sizes && product.sizes.length > 0 && (
                            <div className="sm:max-w-[300px]">
                                <span className="font-mono text-[11px] uppercase tracking-wide text-grey">Size</span>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {product.sizes.map((s) => {
                                        const active = s.id === selectedSizeId;
                                        const sizeOutOfStock = s.stock <= 0;
                                        return (
                                            <button
                                                key={s.id}
                                                disabled={sizeOutOfStock}
                                                onClick={() => setSelectedSizeId(s.id)}
                                                className={`border px-4 py-2 text-[12.5px] transition ${
                                                    active ? "border-navy bg-navy text-white" : "border-ink/15 text-ink hover:border-ink/30"
                                                } ${sizeOutOfStock ? "cursor-not-allowed text-ink/30 line-through hover:border-ink/15" : ""}`}
                                            >
                                                {s.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {outOfStock && <p className="mt-2 text-[12px] text-alert">This size is currently out of stock.</p>}
                            </div>
                        )}

                        <button
                            onClick={() => addToCart(product.id, qty, selectedSizeId)}
                            disabled={outOfStock}
                            className="w-full bg-navy py-4 sm:max-w-[300px] sm:py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-navy"
                        >
                            {outOfStock ? "Out of Stock" : "Add to Bag"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-14 md:mt-20">
                <SectionTitle num="—" title="Reviews" />

                <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-[260px_1fr]">
                    <div className="flex flex-col gap-8 lg:border-r lg:border-ink/10 lg:pr-10">
                        <div>
                            <div className="font-display text-[44px] leading-none text-ink">{avgRating.toFixed(1)}</div>
                            <div className="mt-2">
                                <StarRating rating={avgRating} />
                            </div>
                            <div className="mt-1 font-mono text-[11px] text-grey">
                                {total} review{total === 1 ? "" : "s"}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {([5, 4, 3, 2, 1] as const).map((n) => {
                                const count = countByStar[n];
                                const pct = total ? (count / total) * 100 : 0;
                                return (
                                    <div key={n} className="flex items-center gap-2.5">
                                        <span className="w-7 flex-none font-mono text-[11px] text-grey">
                                            {n}
                                            <span className="text-gold">★</span>
                                        </span>
                                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-off">
                                            <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                                        </span>
                                        <span className="w-5 flex-none text-right font-mono text-[11px] text-grey">{count}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-1">
                            {(["all", 5, 4, 3, 2, 1] as const).map((f) => {
                                const label = f === "all" ? "All Reviews" : `${f} Star${f === 1 ? "" : "s"}`;
                                const count = f === "all" ? total : countByStar[f];
                                const active = ratingFilter === f;
                                return (
                                    <button
                                        key={f}
                                        onClick={() => setRatingFilter(f)}
                                        className={`flex items-center justify-between px-3 py-2 text-left text-[12.5px] transition ${
                                            active ? "bg-navy text-white" : "text-ink hover:bg-off"
                                        }`}
                                    >
                                        <span>{label}</span>
                                        <span className={`font-mono text-[11px] ${active ? "text-white/70" : "text-grey"}`}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="min-w-0">
                        {!reviewsLoaded ? (
                            <SkeletonGroup className="flex flex-col divide-y divide-ink/10">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex gap-3 py-6 first:pt-0 sm:gap-4">
                                        <Skeleton tone="soft" className="h-10 w-10 flex-none rounded-full" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <Skeleton className="h-[13px] w-28" />
                                                <Skeleton tone="soft" className="h-[11px] w-16" />
                                            </div>
                                            <Skeleton tone="soft" className="mt-2 h-3 w-24" />
                                            <Skeleton tone="soft" className="mt-3 h-3 w-full max-w-[620px]" />
                                            <Skeleton tone="soft" className="mt-2 h-3 w-3/5" />
                                        </div>
                                    </div>
                                ))}
                            </SkeletonGroup>
                        ) : filteredReviews.length === 0 ? (
                            <p className="text-[13px] text-grey">
                                {total === 0 ? "No reviews yet — be the first to share your experience." : "No reviews at this rating."}
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y divide-ink/10">
                                {pagedReviews.map((r) => (
                                    <div key={r.id} className="flex gap-3 py-6 first:pt-0 sm:gap-4">
                                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy font-mono text-[11px] text-white">
                                            {initials(r.author)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-x-4">
                                                <span className="text-[13px] font-medium text-ink">{r.author}</span>
                                                <span className="font-mono text-[11px] text-grey">{r.date}</span>
                                            </div>
                                            <StarRating rating={r.rating} />
                                            <p className="-mt-1 max-w-[620px] text-[13px] leading-relaxed text-grey">{r.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Pagination page={currentReviewPage} totalPages={totalReviewPages} onChange={setReviewPage} />
                    </div>
                </div>
            </div>

            {related.length > 0 && (
                <div className="mt-14 border-t border-ink/10 pt-10 md:mt-20 md:pt-14">
                    <SectionTitle num="—" title="You May Also Like" />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                        {related.map((rp) => (
                            <div key={rp.id}>
                                <Card product={rp} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ReviewModal
                open={reviewOpen}
                onClose={() => setReviewOpen(false)}
                showToast={showToast}
                productId={product.id}
                onCreated={(review) => {
                    setReviews((prev) => [review, ...prev]);
                    setRatingFilter("all");
                }}
            />
        </div>
    );
}
