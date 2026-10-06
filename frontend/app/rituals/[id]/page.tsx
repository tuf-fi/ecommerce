"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import SectionTitle from "@/components/ui/SectionTitle";
import StarRating from "@/components/ui/StarRating";
import { useContent } from "@/library/content";
import { useStore } from "@/library/store";
import { getProduct, cheapestSizeId, Product } from "@/library/products";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function RitualPage() {
    const { id } = useParams<{ id: string }>();
    const { rituals } = useContent();
    const { addToCart, wishlist, toggleWishlist } = useStore();
    const ritual = rituals.find((r) => r.id === Number(id));
    const mounted = useMounted();

    if (!mounted) return <RitualSkeleton />;

    if (!ritual) {
        return (
            <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-25 pb-20 text-center">
                <p className="text-[13px] text-grey">
                    That ritual doesn&apos;t exist.{" "}
                    <Link href="/#rituals" className="text-pink-dark underline">
                        Back to Rituals
                    </Link>
                </p>
            </div>
        );
    }

    const products = ritual.productIds.map((pid) => getProduct(pid)).filter((p): p is Product => p !== undefined);
    const totalPrice = products.reduce((sum, p) => sum + p.price, 0);

    function handleAddAllToBag() {
        for (const product of products) {
            addToCart(product.id, 1, cheapestSizeId(product));
        }
    }

    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-25 pb-20">
            <div className="mx-auto mb-8 max-w-[680px]">
                <Link href="/#rituals" className="inline-block text-[12.5px] font-medium text-grey transition-colors hover:text-pink-dark">
                    ← Rituals
                </Link>
            </div>

            {ritual.image ? (
                <div className="relative -mx-[var(--gutter)] mb-10 h-[46vh] max-h-[560px] min-h-[380px] w-[calc(100%+var(--gutter)*2)] overflow-hidden">
                    <Image
                        src={ritual.image}
                        alt={ritual.title}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        unoptimized={typeof ritual.image === "string"}
                    />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 px-8 pb-10 sm:px-12">
                        <span className="eyebrow mb-3 block text-white/70">{ritual.eyebrow}</span>
                        <h1 className="max-w-[680px] text-[clamp(28px,4.2vw,50px)] font-medium text-white">{ritual.title}</h1>
                    </div>
                </div>
            ) : (
                <div className="mb-10 text-center">
                    <span className="eyebrow mb-3 block text-grey">{ritual.eyebrow}</span>
                    <h1 className="mx-auto max-w-[680px] text-[clamp(28px,4.2vw,50px)] font-medium text-ink">{ritual.title}</h1>
                </div>
            )}

            <div className="mx-auto mb-14 max-w-[680px] text-center">
                <p className="border-l-2 border-pink pl-5 text-left text-[18px] leading-relaxed text-ink">{ritual.copy}</p>
            </div>

            {products.length > 0 && (
                // Sticky bundle summary + numbered step list, not a flat product grid — reads as an order to follow.
                <div className="mx-auto max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
                    <aside className="flex flex-col gap-7 lg:sticky lg:top-[calc(var(--navbar-h,72px)+24px)] lg:self-start lg:border-r lg:border-ink/10 lg:pr-10">
                        <div>
                            <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-grey">The Ritual</span>
                            <div className="mt-2 font-display text-[34px] leading-none text-ink">₱{totalPrice.toLocaleString()}</div>
                            <p className="mt-1.5 text-[12.5px] text-grey">
                                {products.length} product{products.length === 1 ? "" : "s"}, full routine
                            </p>
                        </div>

                        <ol className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                            {products.map((product, i) => (
                                <li key={product.id}>
                                    <a href={`#step-${product.id}`} className="group flex items-center gap-3 py-2.5">
                                        <span className="flex h-7 w-7 flex-none items-center justify-center border border-ink/15 font-mono text-[10.5px] text-grey transition group-hover:border-pink-btn group-hover:text-pink-dark">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className="truncate text-[13px] text-ink transition group-hover:text-pink-dark">{product.title}</span>
                                    </a>
                                </li>
                            ))}
                        </ol>

                        <button
                            onClick={handleAddAllToBag}
                            className="group/cta inline-flex items-center justify-center gap-2.5 bg-navy px-6 py-3.5 text-[12.5px] font-semibold uppercase tracking-wide text-white transition hover:bg-pink-dark"
                        >
                            Add Ritual to Bag
                            <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                        </button>
                    </aside>

                    <div className="min-w-0">
                        <SectionTitle num="—" title="What's in it" />

                        <div className="flex flex-col divide-y divide-ink/10 border-t border-ink/10">
                            {products.map((product, i) => {
                                const isWished = wishlist.includes(product.id);
                                return (
                                    <div key={product.id} id={`step-${product.id}`} className="flex scroll-mt-24 gap-5 py-8 first:pt-0 sm:gap-6">
                                        <span className="flex-none pt-1 font-mono text-[12px] text-grey">{String(i + 1).padStart(2, "0")}</span>

                                        <Link
                                            href={`/shop/${product.id}`}
                                            className="group relative aspect-[4/5] w-[96px] flex-none overflow-hidden border border-ink/10 sm:w-[140px]"
                                        >
                                            <Image
                                                src={product.image}
                                                alt={product.title}
                                                fill
                                                sizes="140px"
                                                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                                            />
                                        </Link>

                                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                            <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{product.category}</span>
                                            <Link
                                                href={`/shop/${product.id}`}
                                                className="text-[16px] font-medium leading-snug text-ink transition hover:text-pink-dark"
                                            >
                                                {product.title}
                                            </Link>
                                            <StarRating rating={product.rating} count={product.count} />
                                            <p className="mt-1 line-clamp-2 max-w-[440px] text-[13px] leading-relaxed text-grey">{product.desc}</p>

                                            <div className="mt-3 flex items-center gap-4">
                                                <span className="font-mono text-[13px] text-ink">₱{product.price.toLocaleString()}</span>
                                                <button
                                                    onClick={() => addToCart(product.id, 1, cheapestSizeId(product))}
                                                    className="border border-ink/15 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                                                >
                                                    Add to Bag
                                                </button>
                                                <button
                                                    aria-label="Toggle wishlist"
                                                    onClick={() => toggleWishlist(product.id)}
                                                    className={`ml-auto flex h-11 w-11 flex-none items-center justify-center border transition hover:border-pink-btn hover:bg-pink-btn hover:text-white ${
                                                        isWished ? "border-pink-btn bg-pink-btn text-white" : "border-ink/15 text-ink"
                                                    }`}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RitualSkeleton() {
    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-8 pt-25 pb-20">
            <SkeletonGroup>
                <div className="mx-auto mb-8 max-w-[680px]">
                    <Skeleton className="h-[12.5px] w-24" />
                </div>

                <div className="relative -mx-[var(--gutter)] mb-10 h-[46vh] max-h-[560px] min-h-[380px] w-[calc(100%+var(--gutter)*2)] overflow-hidden">
                    <Skeleton tone="faint" className="absolute inset-0 h-full w-full" />
                    <div className="absolute inset-x-0 bottom-0 px-8 pb-10 sm:px-12">
                        <Skeleton className="mb-3 h-3 w-28" />
                        <Skeleton className="h-[42px] w-[60%] max-w-[560px]" />
                    </div>
                </div>

                <div className="mx-auto mb-14 max-w-[680px]">
                    <Skeleton tone="outline" className="h-[52px] w-full" />
                </div>

                <div className="mx-auto max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
                    <div className="flex flex-col gap-7">
                        <div>
                            <Skeleton className="h-[10.5px] w-20" />
                            <Skeleton className="mt-2 h-[30px] w-28" />
                            <Skeleton tone="soft" className="mt-2 h-3 w-32" />
                        </div>
                        <div className="flex flex-col gap-2.5 border-y border-ink/10 py-2.5">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                        <Skeleton tone="outline" className="h-[46px] w-full" />
                    </div>

                    <div>
                        <div className="mb-11 flex items-center gap-x-5">
                            <Skeleton className="h-[10.5px] w-3" />
                            <Skeleton className="h-[10.5px] w-32" />
                            <span className="h-px flex-1 bg-grey-light/40" />
                        </div>

                        <div className="flex flex-col divide-y divide-ink/10 border-t border-ink/10">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex gap-6 py-8 first:pt-0">
                                    <Skeleton tone="faint" className="aspect-[4/5] w-[140px] flex-none" />
                                    <div className="flex flex-1 flex-col gap-2">
                                        <Skeleton className="h-[10px] w-16" />
                                        <Skeleton className="h-[16.5px] w-3/5" />
                                        <Skeleton tone="soft" className="h-3 w-24" />
                                        <div className="mt-3 flex items-center gap-4">
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
        </div>
    );
}
