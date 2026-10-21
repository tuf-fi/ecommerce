"use client";

import { useEffect, useMemo, useState } from "react";
import WishlistButton from "@/components/ui/WishlistButton";
import Link from "next/link";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { useStore } from "@/library/store";
import { PRODUCTS, getProduct, cheapestSizeId, parseDescription, Product } from "@/library/products";
import PriceTag from "@/components/ui/PriceTag";
import type { Review } from "@/library/reviews";
import { listProductReviews } from "@/library/api/reviews";
import StarRating from "@/components/ui/StarRating";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import Pagination from "@/components/ui/Pagination";
import ReviewModal from "@/components/modals/ReviewModal";
import Modal from "@/components/ui/Modal";
import { getPaymentInstructions } from "@/library/api/payments";

const REVIEWS_PAGE_SIZE = 10;
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

function initials(name: string) {
    if (!name.trim()) return "?";
    return name.trim().slice(0, 2).toUpperCase();
}

export default function ProductPage() {
    const { id } = useParams<{ id: string }>();
    const product = getProduct(Number(id));

    if (!product) notFound();

    return <ProductPageContent key={product.id} product={product} />;
}

function ProductPageContent({ product }: { product: Product }) {
    const { addToCart, isLoggedIn, openModal, showToast } = useStore();
    const [qty, setQty] = useState(1);
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(() => cheapestSizeId(product));
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    const [reviewsFailed, setReviewsFailed] = useState(false);
    const [reviewsTick, setReviewsTick] = useState(0);
    const [justAdded, setJustAdded] = useState(false);
    const [viewPhoto, setViewPhoto] = useState<{ photos: string[]; index: number; author: string } | null>(null);
    const [payLabels, setPayLabels] = useState<string[]>([]);

    useEffect(() => {
        let alive = true;
        getPaymentInstructions()
            .then((i) => alive && setPayLabels(i.methods.filter((m) => m.accountNumber.trim()).map((m) => m.label)))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        let stale = false;
        listProductReviews(product.id)
            .then(({ reviews: list }) => {
                if (stale) return;
                setReviews(list);
                setReviewsFailed(false);
            })
            .catch(() => {
                // Reviews are supplementary; the page works without them, but must not claim there are none.
                if (!stale) setReviewsFailed(true);
            })
            .finally(() => !stale && setReviewsLoaded(true));
        return () => {
            stale = true;
        };
    }, [product.id, reviewsTick]);
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
    const [reviewPage, setReviewPage] = useState(1);

    const { intro, sections } = parseDescription(product.desc);

    function writeReview() {
        if (!isLoggedIn) {
            showToast("error", "Sign in to write a review.");
            openModal("login");
            return;
        }
        setReviewOpen(true);
    }

    const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
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
            <Link href="/shop" className="mb-4 inline-flex min-h-11 items-center text-meta font-medium text-grey hover:text-pink-dark sm:mb-6">
                ← Shop
            </Link>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
                <div className="group relative aspect-[4/5] max-h-[58svh] overflow-hidden border border-ink/10 lg:max-h-none lg:sticky lg:top-[calc(var(--navbar-h,72px)+24px)] lg:self-start">
                    <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <WishlistButton productId={product.id} className="absolute top-4 right-4" />
                </div>

                {/* Two clusters — identity and purchase — separated by one gap and rule, not a shared mt-* scale. */}
                <div className="flex flex-col">
                    <div className="flex flex-col gap-2">
                        <span className="font-mono text-label uppercase tracking-[.16em] text-grey">{product.category}</span>
                        <h1 className="text-[clamp(24px,3vw,34px)] font-medium leading-tight text-ink">{product.title}</h1>

                        <button onClick={writeReview} className="flex min-h-11 items-center gap-2">
                            <StarRating rating={avgRating} count={total || product.count} />
                            <span className="text-label text-pink-dark underline underline-offset-2">Write a review</span>
                        </button>

                        <PriceTag price={priceSource.price} salePrice={priceSource.salePrice} className="block font-mono text-title text-ink" />

                        {intro && <p className="mt-2 max-w-[440px] text-body leading-relaxed text-grey">{intro}</p>}
                    </div>

                    <div className="my-6 h-px w-full max-w-[300px] sm:my-8 bg-ink/10" />

                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between sm:max-w-[300px]">
                            <span className="font-mono text-label uppercase tracking-wide text-grey">Quantity</span>
                            <div className="flex items-center border border-ink/15">
                                <button
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    aria-label="Decrease quantity"
                                    className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-off"
                                >
                                    –
                                </button>
                                <span className="w-8 text-center text-small text-ink">{qty}</span>
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
                                <span className="font-mono text-label uppercase tracking-wide text-grey">Size</span>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {product.sizes.map((s) => {
                                        const active = s.id === selectedSizeId;
                                        const sizeOutOfStock = s.stock <= 0;
                                        return (
                                            <button
                                                key={s.id}
                                                disabled={sizeOutOfStock}
                                                onClick={() => setSelectedSizeId(s.id)}
                                                className={`min-h-11 border px-4 py-2 text-meta transition ${
                                                    active ? "border-navy bg-navy text-white" : "border-ink/15 text-ink hover:border-ink/30"
                                                } ${sizeOutOfStock ? "cursor-not-allowed text-grey line-through hover:border-ink/15" : ""}`}
                                            >
                                                {s.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {outOfStock && <p className="mt-2 text-meta text-alert">This size is currently out of stock.</p>}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                addToCart(product.id, qty, selectedSizeId);
                                setJustAdded(true);
                                window.setTimeout(() => setJustAdded(false), 1800);
                            }}
                            disabled={outOfStock}
                            className="ui-btn ui-btn-primary w-full sm:max-w-[300px]"
                        >
                            {outOfStock ? "Out of Stock" : justAdded ? "Added to bag" : "Add to Bag"}
                        </button>
                        <div className="mt-2 max-w-[440px] border-y border-ink/10 sm:mt-4">
                            {sections.map((sec, i) => (
                                <details key={sec.title} open={i === 0} className="group border-b border-ink/10 last:border-b-0">
                                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3.5 font-mono text-label uppercase tracking-[.14em] text-grey marker:content-none [&::-webkit-details-marker]:hidden">
                                        {sec.title}
                                        <span aria-hidden="true" className="text-body text-ink transition group-open:rotate-45">+</span>
                                    </summary>
                                    <p className="m-0 mb-4 whitespace-pre-line text-small leading-relaxed text-grey">{sec.body}</p>
                                </details>
                            ))}
                            {sections.length === 0 && !reviewsFailed && (
                                <p className="m-0 py-3.5 text-meta leading-relaxed text-grey">
                                    Full ingredients and how to use are on the way. Questions about this formula?{" "}
                                    <Link href="/#contact" className="tap-area underline underline-offset-4">Ask us</Link>.
                                </p>
                            )}
                        </div>
                        <p className="m-0 text-label leading-relaxed text-grey sm:max-w-[300px]" aria-live="polite">
                            {payLabels.length > 0 && <>Pay by {payLabels.join(", ")}. </>}
                            <Link href="/pages/shipping-returns" className="tap-area underline underline-offset-4">Shipping &amp; returns</Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-14 md:mt-20">
                <SectionTitle num="—" title="Reviews" />

                {reviewsLoaded && reviewsFailed ? (
                    <div role="alert" className="mx-auto flex max-w-[420px] flex-col items-center py-10 text-center md:py-14">
                        <h3 className="m-0 mb-2 text-subhead font-medium text-ink">Reviews couldn&apos;t load</h3>
                        <p className="m-0 mb-7 text-small leading-relaxed text-grey">Check your connection and try again.</p>
                        <button type="button" onClick={() => { setReviewsLoaded(false); setReviewsTick((n) => n + 1); }} className="ui-btn ui-btn-secondary">
                            Try again
                        </button>
                    </div>
                ) : reviewsLoaded && total === 0 ? (
                    <div className="mx-auto flex max-w-[420px] flex-col items-center py-10 text-center md:py-14">
                        <h3 className="m-0 mb-2 text-subhead font-medium text-ink">No reviews yet</h3>
                        <p className="m-0 mb-7 text-small leading-relaxed text-grey">Be the first to share how this formula worked for your skin.</p>
                        <button type="button" onClick={writeReview} className="ui-btn ui-btn-primary ui-btn-lg">
                            Write a review
                        </button>
                    </div>
                ) : (
                <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-[260px_1fr]">
                    <div className="flex flex-col gap-8 lg:border-r lg:border-ink/10 lg:pr-10">
                        <div>
                            <div className="font-display text-[44px] leading-none text-ink">{avgRating.toFixed(1)}</div>
                            <div className="mt-2">
                                <StarRating rating={avgRating} />
                            </div>
                            <div className="mt-1 font-mono text-label text-grey">
                                {total} review{total === 1 ? "" : "s"}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {([5, 4, 3, 2, 1] as const).map((n) => {
                                const count = countByStar[n];
                                const pct = total ? (count / total) * 100 : 0;
                                return (
                                    <div key={n} className="flex items-center gap-2.5">
                                        <span className="w-7 flex-none font-mono text-label text-grey">
                                            {n}
                                            <span className="text-gold">★</span>
                                        </span>
                                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-off">
                                            <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                                        </span>
                                        <span className="w-5 flex-none text-right font-mono text-label text-grey">{count}</span>
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
                                        className={`flex items-center justify-between px-3 py-2 text-left text-meta transition ${
                                            active ? "bg-navy text-white" : "text-ink hover:bg-off"
                                        }`}
                                    >
                                        <span>{label}</span>
                                        <span className={`font-mono text-label ${active ? "text-white/70" : "text-grey"}`}>{count}</span>
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
                            <p className="text-small text-grey">
                                {total === 0 ? "No reviews yet — be the first to share your experience." : "No reviews at this rating."}
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y divide-ink/10">
                                {pagedReviews.map((r) => (
                                    <div key={r.id} className="flex gap-3 py-6 first:pt-0 sm:gap-4">
                                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy font-mono text-label text-white">
                                            {initials(r.author)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-x-4">
                                                <span className="text-small font-medium text-ink">{r.author}</span>
                                                <span className="font-mono text-label text-grey">{r.date}</span>
                                            </div>
                                            <StarRating rating={r.rating} />
                                            <p className="-mt-1 max-w-[620px] text-small leading-relaxed text-grey">{r.text}</p>
                                            {r.photos && r.photos.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {r.photos.map((src, i) => (
                                                        <button
                                                            key={src}
                                                            type="button"
                                                            onClick={() => setViewPhoto({ photos: r.photos!, index: i, author: r.author })}
                                                            aria-label={`View photo ${i + 1} of ${r.photos!.length} from ${r.author}'s review`}
                                                            className="block h-14 w-14 overflow-hidden border border-ink/10 transition hover:border-ink/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                                                        >
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Pagination page={currentReviewPage} totalPages={totalReviewPages} onChange={setReviewPage} />
                    </div>
                </div>
                )}
            </div>

            {related.length > 0 && (
                <div className="mt-14 md:mt-20">
                    <SectionTitle num="—" title="You May Also Like" />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-5">
                        {related.map((rp) => (
                            <div key={rp.id}>
                                <Card product={rp} dense />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Modal open={viewPhoto !== null} onClose={() => setViewPhoto(null)} maxWidth="max-w-none" title="Review photo" variant="viewer">
                {viewPhoto && <PhotoViewer viewer={viewPhoto} onClose={() => setViewPhoto(null)} onChange={(index) => setViewPhoto({ ...viewPhoto, index })} />}
            </Modal>

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

const ARROW_PATH = { prev: "M15 5l-7 7 7 7", next: "M9 5l7 7-7 7" };

// Dark, quiet viewer: the photo on navy, a hairline strip of thumbnails, arrow keys to step through.
function PhotoViewer({ viewer, onChange, onClose }: { viewer: { photos: string[]; index: number; author: string }; onChange: (index: number) => void; onClose: () => void }) {
    const { photos, index, author } = viewer;
    const count = photos.length;
    const go = (to: number) => onChange((to + count) % count);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (count < 2) return;
            if (e.key === "ArrowLeft") onChange((index - 1 + count) % count);
            if (e.key === "ArrowRight") onChange((index + 1) % count);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [index, count, onChange]);

    const arrow = (dir: "prev" | "next") => (
        <button
            type="button"
            onClick={() => go(index + (dir === "next" ? 1 : -1))}
            aria-label={dir === "next" ? "Next photo" : "Previous photo"}
            className={`absolute top-[calc(50%-2rem)] ${dir === "next" ? "right-1 sm:right-4" : "left-1 sm:left-4"} flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/70 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white`}
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ARROW_PATH[dir]} />
            </svg>
        </button>
    );

    return (
        <div
            className="relative flex h-full flex-col items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {count > 1 && arrow("prev")}
            {count > 1 && arrow("next")}
            <div className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[index]} alt={`Photo ${index + 1} from ${author}'s review`} className="block max-h-[calc(100dvh-12rem)] w-auto max-w-[calc(100vw-6.5rem)] object-contain sm:max-w-[680px]" />
            </div>
            <div className="mt-5 flex flex-col items-center gap-3">
                {count > 1 && (
                    <ul className="m-0 flex list-none justify-center gap-1.5 p-0">
                        {photos.map((src, i) => (
                            <li key={src}>
                                <button
                                    type="button"
                                    onClick={() => onChange(i)}
                                    aria-label={`Show photo ${i + 1}`}
                                    aria-current={i === index}
                                    className={`block h-10 w-10 overflow-hidden transition focus-visible:ring-2 focus-visible:ring-white ${i === index ? "opacity-100 ring-1 ring-white" : "opacity-50 hover:opacity-90"}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="" className="h-full w-full object-cover" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="m-0 font-mono text-label uppercase tracking-[.14em] text-white/60">
                    Photo from {author}
                    {count > 1 && (
                        <span aria-live="polite">
                            {" · "}
                            {index + 1} / {count}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}
