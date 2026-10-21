"use client";

import Image from "next/image";
import WishlistButton from "@/components/ui/WishlistButton";
import Link from "next/link";
import { useParams } from "next/navigation";
import SectionTitle from "@/components/ui/SectionTitle";
import StarRating from "@/components/ui/StarRating";
import { useContent } from "@/library/content";
import { useStore } from "@/library/store";
import { getProduct, cheapestSizeId, currentPrice, Product } from "@/library/products";
import PriceTag from "@/components/ui/PriceTag";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function RitualPage() {
    const { id } = useParams<{ id: string }>();
    const { rituals } = useContent();
    const { addToCart, wishlist, setWishlistFor } = useStore();
    const ritual = rituals.find((r) => r.id === Number(id));
    const mounted = useMounted();

    if (!mounted) return <RitualSkeleton />;

    if (!ritual) {
        return (
            <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-25 pb-20 text-center">
                <p className="text-small text-grey">
                    That ritual doesn&apos;t exist.{" "}
                    <Link href="/#rituals" className="text-pink-dark underline">
                        Back to Rituals
                    </Link>
                </p>
            </div>
        );
    }

    const products = ritual.productIds.map((pid) => getProduct(pid)).filter((p): p is Product => p !== undefined);
    const totalPrice = products.reduce((sum, p) => sum + currentPrice(p), 0);

    const allSaved = products.length > 0 && products.every((p) => wishlist.includes(p.id));

    function handleAddAllToBag() {
        for (const product of products) {
            addToCart(product.id, 1, cheapestSizeId(product));
        }
    }

    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[var(--navbar-h,67px)] pb-20">
            {ritual.image ? (
                <div className="relative -mx-[var(--gutter)] h-[46vh] max-h-[560px] min-h-[380px] w-[calc(100%+var(--gutter)*2)] overflow-hidden">
                    <Image src={ritual.image} alt={ritual.title} fill sizes="100vw" className="object-cover" unoptimized={typeof ritual.image === "string"} />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 px-[var(--gutter)] pb-10 md:pb-12">
                        <div className="mx-auto max-w-[1100px]">
                            <span className="eyebrow mb-3 block text-white/70">{ritual.eyebrow}</span>
                            <h1 className="max-w-[680px] text-[clamp(28px,4.2vw,50px)] font-medium text-white">{ritual.title}</h1>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mx-auto max-w-[1100px] pt-10">
                    <span className="eyebrow mb-3 block text-grey">{ritual.eyebrow}</span>
                    <h1 className="max-w-[680px] text-[clamp(28px,4.2vw,50px)] font-medium text-ink">{ritual.title}</h1>
                </div>
            )}

            <div className="mx-auto max-w-[1100px] pt-6 md:pt-8">
                <Link href="/#rituals" className="inline-flex min-h-11 items-center text-meta font-medium text-grey transition-colors hover:text-pink-dark">
                    ← Rituals
                </Link>
                <p className="mt-4 mb-14 max-w-[680px] border-l-2 border-pink pl-5 text-title font-medium leading-relaxed text-ink/80 md:mb-16">{ritual.copy}</p>
            </div>

            {products.length > 0 && (
                // Sticky bundle summary + numbered step list, not a flat product grid — reads as an order to follow.
                <div className="mx-auto max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px] lg:gap-16">
                    <div className="min-w-0">
                        <SectionTitle title="What's in it" />

                        <div className="flex flex-col divide-y divide-ink/10">
                            {products.map((product, i) => {
                                return (
                                    <div
                                        key={product.id}
                                        id={`step-${product.id}`}
                                        className="grid scroll-mt-24 grid-cols-1 gap-y-5 py-8 first:pt-8 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-x-8 sm:gap-y-0 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-10"
                                    >
                                        <div className="relative aspect-square w-full self-start">
                                            <Link href={`/shop/${product.id}`} className="group relative block h-full w-full overflow-hidden border border-ink/10">
                                                <Image
                                                    src={product.image}
                                                    alt={product.title}
                                                    fill
                                                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 100vw"
                                                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                                                />
                                            </Link>
                                            <WishlistButton productId={product.id} className="absolute top-2 right-2" />
                                        </div>

                                        <div className="flex min-w-0 flex-col">
                                            <span className="font-mono text-label uppercase tracking-[.16em] text-grey">
                                                <span className="tabular-nums text-ink">{String(i + 1).padStart(2, "0")}</span>
                                                <span aria-hidden="true"> — </span>
                                                {product.category}
                                            </span>
                                            <Link href={`/shop/${product.id}`} className="mt-1.5 text-lead leading-snug font-medium text-ink transition hover:text-pink-dark sm:text-subhead">
                                                {product.title}
                                            </Link>
                                            <div className="mt-2">
                                                <StarRating rating={product.rating} count={product.count} />
                                            </div>
                                            <p className="mt-3 line-clamp-3 max-w-[460px] text-small leading-relaxed text-grey">{product.desc}</p>

                                            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-ink/10 pt-4 sm:mt-auto">
                                                <PriceTag price={product.price} salePrice={product.salePrice} className="font-mono text-body text-ink" />
                                                <button onClick={() => addToCart(product.id, 1, cheapestSizeId(product))} className="ui-btn ui-btn-primary ui-btn-sm">
                                                    Add to Bag
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <aside className="order-first flex flex-col gap-7 lg:sticky lg:top-[calc(var(--promo-h,0px)+var(--navbar-h,72px)+24px)] lg:order-last lg:h-fit lg:self-start lg:border-l lg:border-ink/10 lg:pl-10">
                        <div>
                            <span className="font-mono text-label uppercase tracking-[.16em] text-grey">The Ritual</span>
                            <div className="mt-2 font-display text-display-md leading-none text-ink">₱{totalPrice.toLocaleString()}</div>
                            <p className="mt-1.5 text-meta text-grey">
                                {products.length} product{products.length === 1 ? "" : "s"}, full routine
                            </p>
                        </div>

                        <ol className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                            {products.map((product, i) => (
                                <li key={product.id}>
                                    <a href={`#step-${product.id}`} className="group flex items-center gap-3 py-2.5">
                                        <span className="w-5 flex-none font-mono text-label tabular-nums text-grey transition group-hover:text-pink-dark">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className="truncate text-small text-ink transition group-hover:text-pink-dark">{product.title}</span>
                                    </a>
                                </li>
                            ))}
                        </ol>

                        <button onClick={handleAddAllToBag} className="ui-btn ui-btn-primary ui-btn-sm group/cta">
                            Add Ritual to Bag
                            <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                        </button>
                            <button
                                type="button"
                                aria-pressed={allSaved}
                                onClick={() => setWishlistFor(products.map((p) => p.id), !allSaved, "this ritual")}
                                className="ui-btn ui-btn-secondary ui-btn-sm -mt-3"
                            >
                                {allSaved ? "Saved to Wishlist" : "Save Ritual to Wishlist"}
                            </button>
                    </aside>
                </div>
            )}
        </div>
    );
}

function RitualSkeleton() {
    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[var(--navbar-h,67px)] pb-20">
            <SkeletonGroup>
                <div className="relative -mx-[var(--gutter)] h-[46vh] max-h-[560px] min-h-[380px] w-[calc(100%+var(--gutter)*2)] overflow-hidden">
                    <Skeleton tone="faint" className="absolute inset-0 h-full w-full" />
                    <div className="absolute inset-x-0 bottom-0 px-[var(--gutter)] pb-10 md:pb-12">
                        <div className="mx-auto max-w-[1100px]">
                            <Skeleton className="mb-3 h-3 w-28" />
                            <Skeleton className="h-[42px] w-[60%] max-w-[560px]" />
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-[1100px] pt-6 md:pt-8">
                    <div className="flex min-h-11 items-center">
                        <Skeleton className="h-[12.5px] w-24" />
                    </div>
                    <Skeleton tone="soft" className="mt-4 mb-14 h-[52px] w-full max-w-[620px] md:mb-16" />
                </div>

                <div className="mx-auto max-w-[1100px] grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px] lg:gap-16">
                    <div className="flex flex-col gap-7 lg:order-last lg:border-l lg:border-transparent lg:pl-10">
                        <div>
                            <Skeleton className="h-[10.5px] w-20" />
                            <Skeleton className="mt-2 h-[34px] w-28" />
                            <Skeleton tone="soft" className="mt-1.5 h-3 w-32" />
                        </div>
                        <div className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5">
                                    <Skeleton className="h-[11px] w-5 flex-none" />
                                    <Skeleton className="h-[13px] w-3/5" />
                                </div>
                            ))}
                        </div>
                        <Skeleton tone="outline" className="h-[46px] w-full" />
                    </div>

                    <div>
                        <div className="mb-8 flex items-center gap-x-4 sm:gap-x-5 md:mb-11">
                            <Skeleton className="h-[10.5px] w-32" />
                            <span className="h-px flex-1 bg-grey-light/40" />
                        </div>

                        <div className="flex flex-col divide-y divide-ink/10">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-1 gap-y-5 py-8 first:pt-8 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-x-8 sm:gap-y-0 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-10">
                                    <Skeleton tone="faint" className="aspect-square w-full self-start border border-ink/10" />
                                    <div className="flex min-w-0 flex-col">
                                        <Skeleton className="h-[10px] w-16" />
                                        <Skeleton className="mt-1.5 h-[20px] w-3/5" />
                                        <Skeleton tone="soft" className="mt-2 h-[14px] w-24" />
                                        <Skeleton tone="soft" className="mt-3 h-3 w-full max-w-[460px]" />
                                        <Skeleton tone="soft" className="mt-1.5 h-3 w-4/5 max-w-[460px]" />
                                        <Skeleton tone="soft" className="mt-1.5 h-3 w-3/5 max-w-[460px]" />
                                        <div className="mt-5 flex items-center justify-between gap-4 border-t border-ink/10 pt-4 sm:mt-auto">
                                            <Skeleton className="h-[15px] w-14" />
                                            <div className="flex items-center gap-2">
                                                <Skeleton tone="outline" className="h-11 w-11" />
                                                <Skeleton tone="outline" className="h-11 w-28" />
                                            </div>
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
