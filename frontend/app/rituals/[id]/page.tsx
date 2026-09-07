"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import { useContent } from "@/library/content";
import { useStore } from "@/library/store";
import { getProduct, cheapestSizeId, Product } from "@/library/products";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function RitualPage() {
    const { id } = useParams<{ id: string }>();
    const { rituals } = useContent();
    const { isLoggedIn, openModal, addToCart } = useStore();
    const ritual = rituals.find((r) => r.id === Number(id));
    const mounted = useMounted();

    if (!mounted) return <RitualSkeleton />;

    if (!ritual) {
        return (
            <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20 text-center">
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

    function handleAddAllToBag() {
        if (!isLoggedIn) {
            openModal("login");
            return;
        }
        for (const product of products) {
            addToCart(product.id, 1, cheapestSizeId(product));
        }
    }

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <div className="mx-auto mb-8 max-w-[680px]">
                <Link href="/#rituals" className="inline-block text-[12.5px] font-medium text-grey hover:text-pink-dark">
                    ← Rituals
                </Link>
            </div>

            {ritual.image ? (
                <div className="relative -mx-8 mb-10 h-[46vh] max-h-[560px] min-h-[380px] w-[calc(100%+4rem)] overflow-hidden">
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
                <div className="mx-auto max-w-[1100px]">
                    <div className="mb-8 flex items-center justify-between">
                        <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-grey">What&apos;s in it — {products.length} products</span>
                        <button
                            onClick={handleAddAllToBag}
                            className="group/cta inline-flex items-center gap-2.5 bg-navy px-6 py-3.5 text-[12.5px] font-semibold uppercase tracking-wide text-white transition hover:bg-pink-dark"
                        >
                            Add Ritual to Bag
                            <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                        {products.map((product) => (
                            <Card key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Mirrors the found-ritual state: the back link, full-bleed hero image with
// eyebrow/title overlay, the pull-quote copy block, and the "what's in it"
// header + product grid matching Card's shape.
function RitualSkeleton() {
    return (
        <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <SkeletonGroup>
                <div className="mx-auto mb-8 max-w-[680px]">
                    <Skeleton className="h-[12.5px] w-24" />
                </div>

                <div className="relative -mx-8 mb-10 h-[46vh] max-h-[560px] min-h-[380px] w-[calc(100%+4rem)] overflow-hidden">
                    <Skeleton tone="faint" className="absolute inset-0 h-full w-full" />
                    <div className="absolute inset-x-0 bottom-0 px-8 pb-10 sm:px-12">
                        <Skeleton className="mb-3 h-3 w-28" />
                        <Skeleton className="h-[42px] w-[60%] max-w-[560px]" />
                    </div>
                </div>

                <div className="mx-auto mb-14 max-w-[680px]">
                    <Skeleton tone="outline" className="h-[52px] w-full" />
                </div>

                <div className="mx-auto max-w-[1100px]">
                    <div className="mb-8 flex items-center justify-between">
                        <Skeleton className="h-[10.5px] w-48" />
                        <Skeleton tone="outline" className="h-[46px] w-44" />
                    </div>

                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
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
            </SkeletonGroup>
        </div>
    );
}
