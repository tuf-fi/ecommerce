"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore, lineUnitPrice } from "@/library/store";
import { getProduct } from "@/library/products";
import SectionTitle from "@/components/ui/SectionTitle";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PageIntro from "@/components/sections/PageIntro";
import { PageIntroContent } from "@/library/content";
import { useMounted } from "@/library/useMounted";
import { ApiError } from "@/library/api/client";
import { placeOrder } from "@/library/api/orders";
import { useProducts } from "@/library/productsStore";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

// `preview`/`introPreviewData`: the admin's Cart-intro editor embeds this real page so admins see the intro in
// context — only the intro headline/accent are actually editable here. Everything else renders exactly like the
// real page (quantity steppers, remove, order summary) EXCEPT the summary's `lg:fixed` pin and the mobile fixed
// checkout bar: real `position: fixed` would escape the admin's preview column and float over unrelated admin
// chrome, so preview keeps the summary in normal flow instead and skips the redundant fixed mobile bar.
export default function CartPage({ preview = false, introPreviewData }: { preview?: boolean; introPreviewData?: PageIntroContent } = {}) {
    const { cart, changeQty, removeLine, clearCart, cartTotal: realCartTotal, cartCount: realCartCount, checkoutAddress, isLoggedIn, openModal, showToast } = useStore();
    const { refresh: refreshCatalog } = useProducts();
    const router = useRouter();
    const [placing, setPlacing] = useState(false);
    const realEntries = Object.entries(cart);
    const entries = realEntries;
    const cartCount = realCartCount;
    const cartTotal = realCartTotal;
    const [removeKey, setRemoveKey] = useState<string | null>(null);
    const removeLineItem = removeKey !== null ? cart[removeKey] : null;
    const removeProduct = removeLineItem ? getProduct(removeLineItem.productId) : null;
    const mounted = useMounted();

    async function checkout() {
        if (preview || placing) return;
        if (!isLoggedIn) {
            showToast("error", "Sign in to place your order.");
            openModal("login");
            return;
        }
        if (!checkoutAddress) {
            showToast("error", "Add a delivery address first.");
            router.push("/account/addresses");
            return;
        }
        // Bags saved before the catalogue moved to the server hold string size ids that no longer exist.
        const items = realEntries.map(([, l]) => ({ productId: l.productId, sizeId: l.sizeId === null ? null : Number(l.sizeId), qty: l.qty }));
        if (items.some((i) => i.sizeId !== null && !Number.isInteger(i.sizeId))) {
            showToast("error", "Some items in your bag are out of date — remove them and add them again.");
            return;
        }
        setPlacing(true);
        try {
            // The server prices the order and takes the stock in one transaction; nothing here is trusted.
            const { order } = await placeOrder({ items, address: checkoutAddress.text });
            clearCart();
            showToast("success", `Order ${order.no} placed.`);
            // Straight to the order, where the payment details and screenshot upload open automatically.
            router.push(`/account/purchases?pay=${encodeURIComponent(order.no)}`);
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not place your order. Please try again.");
        } finally {
            setPlacing(false);
            void refreshCatalog();
        }
    }

    if (!mounted) return <CartSkeleton preview={preview} />;

    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : "-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20"}>
            <PageIntro pageKey="cart" previewData={introPreviewData} />

            <SectionTitle num="—" title={`${cartCount} Item${cartCount === 1 ? "" : "s"}`} />

            {entries.length === 0 ? (
                <div className="flex flex-col items-center gap-5 border border-ink/10 py-20 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-soft text-pink-dark">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M6 8h12l-1 11.2a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 8Z" />
                            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                        </svg>
                    </span>
                    <p className="max-w-[320px] text-[13px] leading-relaxed text-grey">
                        Your bag is empty. Browse the catalogue and add a formula or two.
                    </p>
                    {!preview && (
                        <Link
                            href="/shop"
                            className="border border-ink/15 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                        >
                            Browse the Catalogue
                        </Link>
                    )}
                </div>
            ) : (
                <div className={preview ? "" : "pb-28 lg:pr-[420px] lg:pb-0"}>
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
                                                    className="mt-1 block text-left text-[16.5px] font-medium leading-snug text-ink transition hover:text-pink-dark"
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

                    <div
                        className={
                            preview
                                ? "mt-10 border border-ink/10 bg-white p-6 sm:p-8"
                                : "thin-scrollbar shadow-glow mt-10 border border-ink/10 bg-white p-6 sm:p-8 lg:mt-0 lg:fixed lg:inset-y-0 lg:right-0 lg:w-[380px] lg:overflow-y-auto lg:border-0 lg:border-l lg:border-ink/10 lg:p-10 lg:pt-[calc(6.25rem+var(--promo-h,0px))] lg:pb-10"
                        }
                    >
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
                            <Link href="/account/addresses" className="flex-none font-mono text-[10.5px] uppercase tracking-[.1em] text-pink-dark underline underline-offset-2 transition hover:text-pink-btn">
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

                        {/* Below lg, Total/checkout live in the fixed mobile bar instead — this block is lg+ only.
                            In preview it always shows instead, since the fixed mobile bar is skipped entirely there. */}
                        <div className={preview ? "block" : "hidden lg:block"}>
                            <div className="my-5 border-t border-ink/10" />
                            <div className="mb-6 flex items-center justify-between">
                                <span className="text-sm text-ink">Total</span>
                                <span className="font-mono text-xl font-semibold text-ink">₱{cartTotal.toLocaleString()}</span>
                            </div>
                            <button
                                onClick={checkout}
                                disabled={preview || placing}
                                className="w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:bg-off disabled:text-grey"
                            >
                                {placing ? "Placing Order…" : "Place Order"}
                            </button>
                            <p className="mt-2 text-center text-[11.5px] text-grey">
                                {preview ? "Checkout is disabled in preview." : "Next you'll send your payment and upload a screenshot."}
                            </p>
                        </div>
                        <Link href="/shop" className="mt-4 block text-center text-[12px] text-grey underline underline-offset-2 transition hover:text-ink">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            )}

            {/* Mobile-only fixed checkout bar, hidden at lg+ where the sidebar above is already fixed. Skipped
                entirely in preview — a `position: fixed` bar would escape the admin's preview column and float
                over real page chrome, and the summary box above already shows Total/checkout in that mode. */}
            {!preview && entries.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white px-5 py-3 shadow-[0_-8px_24px_rgba(61,90,115,.14)] lg:hidden">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">Total</div>
                            <div className="font-mono text-lg font-semibold text-ink">₱{cartTotal.toLocaleString()}</div>
                        </div>
                        <button
                            onClick={checkout}
                            disabled={placing}
                            className="flex-none bg-navy px-6 py-3 text-[12.5px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:bg-off disabled:text-grey"
                        >
                            {placing ? "Placing Order…" : "Place Order"}
                        </button>
                    </div>
                    <p className="mt-1.5 text-center text-[10.5px] text-grey">Next you&apos;ll send your payment and upload a screenshot.</p>
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

function CartSkeleton({ preview = false }: { preview?: boolean } = {}) {
    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : "-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20"}>
            <SkeletonGroup>
                <Skeleton className="mt-3 h-[34px] w-[70%] max-w-[520px] sm:h-[42px]" />
                <Skeleton className="mt-3 mb-11 h-[34px] w-[45%] max-w-[340px] sm:h-[42px]" />

                <div className="mb-11 flex items-center gap-x-5">
                    <Skeleton className="h-[10.5px] w-3" />
                    <Skeleton className="h-[10.5px] w-20" />
                    <span className="h-px flex-1 bg-grey-light/40" />
                </div>

                <div className={preview ? "" : "pb-28 lg:pr-[420px] lg:pb-0"}>
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

                    <div
                        className={
                            preview
                                ? "mt-10 border border-ink/10 p-6 sm:p-8"
                                : "mt-10 border border-ink/10 p-6 sm:p-8 lg:mt-0 lg:fixed lg:inset-y-0 lg:right-0 lg:w-[380px] lg:border-0 lg:border-l lg:border-ink/10 lg:p-10 lg:pt-[calc(6.25rem+var(--promo-h,0px))] lg:pb-10"
                        }
                    >
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

                        <div className={preview ? "block" : "hidden lg:block"}>
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

                {!preview && (
                    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-ink/10 bg-white px-5 py-3 lg:hidden">
                        <div className="min-w-0">
                            <Skeleton className="mb-1.5 h-[10px] w-12" />
                            <Skeleton className="h-[19px] w-20" />
                        </div>
                        <Skeleton tone="outline" className="h-[42px] w-40 flex-none" />
                    </div>
                )}
            </SkeletonGroup>
        </div>
    );
}
