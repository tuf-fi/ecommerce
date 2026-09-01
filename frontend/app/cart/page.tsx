"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/library/store";
import { useContent } from "@/library/content";
import { getProduct } from "@/library/products";
import SectionTitle from "@/components/ui/SectionTitle";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoginRequiredModal from "@/components/modals/LoginRequiredModal";

export default function CartPage() {
    const { cart, changeQty, removeLine, cartTotal, cartCount, checkoutAddress, showToast, openProduct, isLoggedIn, openModal } = useStore();
    const { pageIntros } = useContent();
    const router = useRouter();
    const entries = Object.entries(cart);
    const [removeId, setRemoveId] = useState<number | null>(null);
    const removeProduct = removeId !== null ? getProduct(removeId) : null;

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
            {/* <span className="eyebrow uppercase text-grey">Your Bag</span> */}
            <h1 className="mt-3 mb-11 max-w-none text-[30px] leading-[1.08] font-normal sm:text-[38px] lg:text-[42px]">
                {pageIntros.cart.headline} <br/><em className="pink-highlight font-normal">{pageIntros.cart.accent}</em>
            </h1>

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
                <div className="pr-[420px]">
                    <div className="flex flex-col divide-y divide-ink/10">
                        {entries.map(([idStr, qty]) => {
                            const p = getProduct(Number(idStr));
                            if (!p) return null;
                            return (
                                <div key={idStr} className="grid grid-cols-[7rem_1fr] gap-5 py-7 first:pt-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6">
                                    <button
                                        onClick={() => openProduct(p.id)}
                                        className="group relative aspect-[4/5] w-full overflow-hidden border border-ink/10 transition hover:border-ink/30"
                                    >
                                        <Image
                                            src={p.image}
                                            alt={p.title}
                                            fill
                                            sizes="128px"
                                            className="object-cover transition duration-500 group-hover:scale-[1.03]"
                                        />
                                    </button>

                                    <div className="flex flex-col">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">{p.category}</span>
                                                <button
                                                    onClick={() => openProduct(p.id)}
                                                    className="mt-1 block text-left text-[16.5px] font-medium leading-snug text-ink"
                                                >
                                                    {p.title}
                                                </button>
                                                <span className="mt-1.5 block font-mono text-[12px] text-grey">
                                                    ₱{p.price.toLocaleString()} each
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setRemoveId(p.id)}
                                                aria-label={`Remove ${p.title}`}
                                                className="flex h-8 w-8 flex-none items-center justify-center text-grey transition hover:text-alert"
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
                                                <button onClick={() => changeQty(p.id, -1)} className="px-3 py-1.5 text-ink transition hover:bg-off">–</button>
                                                <span className="w-8 text-center text-[13px]">{qty}</span>
                                                <button onClick={() => changeQty(p.id, 1)} className="px-3 py-1.5 text-ink transition hover:bg-off">+</button>
                                            </div>
                                            <span className="font-mono text-[16px] font-medium text-ink">₱{(p.price * qty).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="thin-scrollbar shadow-glow fixed inset-y-0 right-0 w-[380px] overflow-y-auto border-l border-ink/10 bg-white p-10 pt-[calc(6.25rem+var(--promo-h,0px))] pb-10">
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
                        <Link href="/shop" className="mt-4 block text-center text-[12px] text-grey underline underline-offset-2">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={removeId !== null}
                title="Remove this item?"
                description={removeProduct ? `"${removeProduct.title}" will be taken out of your bag.` : undefined}
                onConfirm={() => removeId !== null && removeLine(removeId)}
                onClose={() => setRemoveId(null)}
            />
        </div>
    );
}
