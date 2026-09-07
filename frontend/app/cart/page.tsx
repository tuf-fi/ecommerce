"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore, lineUnitPrice } from "@/library/store";
import { getProduct } from "@/library/products";
import SectionTitle from "@/components/ui/SectionTitle";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoginRequiredModal from "@/components/modals/LoginRequiredModal";
import PageIntro from "@/components/sections/PageIntro";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function CartPage() {
    const { cart, changeQty, removeLine, cartTotal, cartCount, checkoutAddress, showToast, isLoggedIn, openModal } = useStore();
    const router = useRouter();
    const entries = Object.entries(cart);
    const [removeKey, setRemoveKey] = useState<string | null>(null);
    const removeLineItem = removeKey !== null ? cart[removeKey] : null;
    const removeProduct = removeLineItem ? getProduct(removeLineItem.productId) : null;
    const mounted = useMounted();

    if (!mounted) return <CartSkeleton />;

    if (!isLoggedIn) {
        return (
            <>
                <div className="min-h-screen bg-white" />
                <LoginRequiredModal
                    open
                    message="You need to be signed in to view your bag."
                    onLogin={() => openModal("login")}
                    onCancel={() => router.push("/")}
                />
            </>
        );
    }

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <PageIntro pageKey="cart" />

            <SectionTitle num="—" title={`${cartCount} Item${cartCount === 1 ? "" : "s"}`} />

            {entries.length === 0 ? (
                <div className="flex flex-col items-center gap-5 border border-ink/10 py-20 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-off text-grey">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M6 8h12l-1 11.2a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 8Z" />
                            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                        </svg>
                    </span>
                    <p className="max-w-[320px] text-[13px] leading-relaxed text-grey">
                        Your bag is empty. Browse the catalogue and add a formula or two.
                    </p>
                    <Link
                        href="/shop"
                        className="border border-ink/15 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                    >
                        Browse the Catalogue
                    </Link>
                </div>
            ) : (
                <div className="pb-28 lg:pr-[420px] lg:pb-0">
                    <div className="flex flex-col divide-y divide-ink/10">
                        {entries.map(([key, line]) => {
                            const p = getProduct(line.productId);
                            if (!p) return null;
                            const size = line.sizeId ? p.sizes?.find((s) => s.id === line.sizeId) : undefined;
                            const unitPrice = lineUnitPrice(line);
                            return (
                                <div key={key} className="grid grid-cols-[7rem_1fr] gap-5 py-7 first:pt-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6">
                                    <Link
                                        href={`/shop/${p.id}`}
                                        className="group relative aspect-[4/5] w-full overflow-hidden border border-ink/10 transition hover:border-ink/30"
                                    >
                                        <Image
                                            src={p.image}
                                            alt={p.title}
                                            fill
                                            sizes="128px"
                                            className="object-cover transition duration-500 group-hover:scale-[1.03]"
                                        />
                                    </Link>

                                    <div className="flex flex-col">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">
                                                    {p.category}
                                                    {size && ` · ${size.label}`}
                                                </span>
                                                <Link
                                                    href={`/shop/${p.id}`}
                                                    className="mt-1 block text-left text-[16.5px] font-medium leading-snug text-ink"
                                                >
                                                    {p.title}
                                                </Link>
                                                <span className="mt-1.5 block font-mono text-[12px] text-grey">
                                                    ₱{unitPrice.toLocaleString()} each
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setRemoveKey(key)}
                                                aria-label={`Remove ${p.title}`}
                                                className="flex h-11 w-11 flex-none items-center justify-center text-grey transition hover:text-alert"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M4 7h16" />
                                                    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                                    <path d="M6 7l1 12.5A2 2 0 0 0 9 21h6a2 2 0 0 0 2-1.5L18 7" />
                                                    <path d="M10 11v6M14 11v6" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-5">
                                            <div className="flex items-center border border-ink/15">
                                                <button onClick={() => changeQty(key, -1)} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-off">–</button>
                                                <span className="w-8 text-center text-[13px]">{line.qty}</span>
                                                <button onClick={() => changeQty(key, 1)} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-off">+</button>
                                            </div>
                                            <span className="font-mono text-[16px] font-medium text-ink">₱{(unitPrice * line.qty).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="thin-scrollbar shadow-glow mt-10 border border-ink/10 bg-white p-6 sm:p-8 lg:mt-0 lg:fixed lg:inset-y-0 lg:right-0 lg:w-[380px] lg:overflow-y-auto lg:border-0 lg:border-l lg:border-ink/10 lg:p-10 lg:pt-[calc(6.25rem+var(--promo-h,0px))] lg:pb-10">
                        <div className="mb-6 flex items-start justify-between gap-3 border-b border-ink/10 pb-6">
                            <div className="min-w-0">
                                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-grey">Deliver To</div>
                                {checkoutAddress ? (
                                    <>
                                        <div className="text-[13px] font-medium text-ink">{checkoutAddress.label}</div>
                                        <div className="mt-0.5 text-[12px] leading-relaxed text-grey">{checkoutAddress.text}</div>
                                    </>
                                ) : (
                                    <div className="text-[12.5px] text-grey">No delivery address on file.</div>
                                )}
                            </div>
                            <Link href="/account/addresses" className="flex-none font-mono text-[10.5px] uppercase tracking-[.1em] text-pink-dark underline underline-offset-2">
                                Change
                            </Link>
                        </div>

                        <div className="mb-5 font-mono text-[10px] uppercase tracking-[.16em] text-grey">Order Summary</div>
                        <div className="flex items-center justify-between text-[13px] text-grey">
                            <span>Subtotal · {cartCount} item{cartCount === 1 ? "" : "s"}</span>
                            <span className="font-mono text-ink">₱{cartTotal.toLocaleString()}</span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between text-[13px] text-grey">
                            <span>Shipping</span>
                            <span className="font-mono text-ink">Calculated at checkout</span>
                        </div>

                        {/* Total + checkout live in the fixed mobile bar below instead,
                            so they're always on screen without scrolling — at lg+ there's
                            no separate bar (the whole card is already a fixed sidebar),
                            so they render here same as before. */}
                        <div className="hidden lg:block">
                            <div className="my-5 border-t border-ink/10" />
                            <div className="mb-6 flex items-center justify-between">
                                <span className="text-sm text-ink">Total</span>
                                <span className="font-mono text-xl font-semibold text-ink">₱{cartTotal.toLocaleString()}</span>
                            </div>
                            {/* TODO: wire up to real PayMongo checkout — currently just a demo toast. */}
                            <button
                                onClick={() => showToast("success", "Checkout isn't wired up yet in this preview.")}
                                className="w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark"
                            >
                                Proceed to Payment
                            </button>
                        </div>
                        <Link href="/shop" className="mt-4 block text-center text-[12px] text-grey underline underline-offset-2">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            )}

            {/* Mobile-only fixed checkout bar — always visible regardless of scroll
                position, so Total/Proceed to Payment never require scrolling to find.
                Hidden at lg+, where the sidebar above is already fixed in full. */}
            {entries.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-ink/10 bg-white px-5 py-3 shadow-[0_-8px_24px_rgba(61,90,115,.14)] lg:hidden">
                    <div className="min-w-0">
                        <div className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">Total</div>
                        <div className="font-mono text-lg font-semibold text-ink">₱{cartTotal.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={() => showToast("success", "Checkout isn't wired up yet in this preview.")}
                        className="flex-none bg-navy px-6 py-3 text-[12.5px] font-semibold tracking-wide text-white transition hover:bg-pink-dark"
                    >
                        Proceed to Payment
                    </button>
                </div>
            )}

            <ConfirmModal
                open={removeKey !== null}
                title="Remove this item?"
                description={removeProduct ? `"${removeProduct.title}" will be taken out of your bag.` : undefined}
                onConfirm={() => removeKey !== null && removeLine(removeKey)}
                onClose={() => setRemoveKey(null)}
            />
        </div>
    );
}

// Mirrors the populated bag: PageIntro's two-line headline, SectionTitle's
// num/title/rule row, a few line-item rows (thumbnail + category/title/price
// + qty stepper), and the fixed order-summary sidebar.
function CartSkeleton() {
    return (
        <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <SkeletonGroup>
                <Skeleton className="mt-3 h-[34px] w-[70%] max-w-[520px] sm:h-[42px]" />
                <Skeleton className="mt-3 mb-11 h-[34px] w-[45%] max-w-[340px] sm:h-[42px]" />

                <div className="mb-11 flex items-center gap-x-5">
                    <Skeleton className="h-[10.5px] w-3" />
                    <Skeleton className="h-[10.5px] w-20" />
                    <span className="h-px flex-1 bg-grey-light/40" />
                </div>

                <div className="pb-28 lg:pr-[420px] lg:pb-0">
                    <div className="flex flex-col divide-y divide-ink/10">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[7rem_1fr] gap-5 py-7 first:pt-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6">
                                <Skeleton tone="faint" className="aspect-[4/5] w-full border border-ink/10" />
                                <div className="flex flex-col">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <Skeleton className="h-[10px] w-16" />
                                            <Skeleton className="mt-2 h-[16.5px] w-4/5" />
                                            <Skeleton tone="soft" className="mt-2 h-3 w-20" />
                                        </div>
                                        <Skeleton tone="soft" className="h-8 w-8 flex-none" />
                                    </div>
                                    <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-5">
                                        <Skeleton tone="outline" className="h-8 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 border border-ink/10 p-6 sm:p-8 lg:mt-0 lg:fixed lg:inset-y-0 lg:right-0 lg:w-[380px] lg:border-0 lg:border-l lg:border-ink/10 lg:p-10 lg:pt-[calc(6.25rem+var(--promo-h,0px))] lg:pb-10">
                        <div className="mb-6 border-b border-ink/10 pb-6">
                            <Skeleton className="mb-2 h-[10px] w-20" />
                            <Skeleton className="h-[13px] w-32" />
                            <Skeleton tone="soft" className="mt-1.5 h-3 w-48" />
                        </div>

                        <Skeleton className="mb-5 h-[10px] w-24" />
                        <div className="flex items-center justify-between">
                            <Skeleton tone="soft" className="h-3 w-28" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                            <Skeleton tone="soft" className="h-3 w-16" />
                            <Skeleton className="h-3 w-24" />
                        </div>

                        <div className="hidden lg:block">
                            <div className="my-5 border-t border-ink/10" />
                            <div className="mb-6 flex items-center justify-between">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <Skeleton tone="outline" className="h-[50px] w-full" />
                        </div>
                        <Skeleton tone="soft" className="mx-auto mt-4 h-3 w-32" />
                    </div>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-ink/10 bg-white px-5 py-3 lg:hidden">
                    <div className="min-w-0">
                        <Skeleton className="mb-1.5 h-[10px] w-12" />
                        <Skeleton className="h-[19px] w-20" />
                    </div>
                    <Skeleton tone="outline" className="h-[42px] w-40 flex-none" />
                </div>
            </SkeletonGroup>
        </div>
    );
}
