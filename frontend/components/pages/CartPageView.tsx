"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore, lineUnitPrice } from "@/library/store";
import { getProduct } from "@/library/products";
import PriceTag from "@/components/ui/PriceTag";
import SectionTitle from "@/components/ui/SectionTitle";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Checkbox from "@/components/ui/Checkbox";
import ActionBar, { BAR_BUTTON, BarArrow, BarTotal } from "@/components/ui/ActionBar";
import PageIntro from "@/components/sections/PageIntro";
import { PageIntroContent } from "@/library/content";
import { useMounted } from "@/library/useMounted";
import { checkCart, type CartCheckResult } from "@/library/api/orders";
import { getCheckoutVoucher } from "@/library/checkoutVoucher";
import { lineSaleSavings } from "@/library/savings";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

// `preview`/`introPreviewData`: the admin's Cart-intro editor embeds this real page so admins see the intro in
// context — only the intro headline/accent are actually editable here. Everything else renders like the real page,
// except the checkout bar: a real `position: fixed` bar would escape the admin's preview column and float over
// unrelated admin chrome, so preview keeps it in normal flow and disables checkout.
export default function CartPageView({ preview = false, introPreviewData }: { preview?: boolean; introPreviewData?: PageIntroContent } = {}) {
    const { cart, changeQty, removeLine, cartCount, isLoggedIn, openModal, showToast, setCheckoutKeys } = useStore();
    const router = useRouter();
    const entries = Object.entries(cart);
    const mounted = useMounted();

    // Tracked as "unticked" so items added later start ticked.
    const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
    const checkedEntries = entries.filter(([key]) => !unchecked.has(key));
    const allChecked = entries.length > 0 && checkedEntries.length === entries.length;
    const someChecked = checkedEntries.length > 0;
    const checkedCount = checkedEntries.reduce((sum, [, l]) => sum + l.qty, 0);
    const itemsTotal = checkedEntries.reduce((sum, [, l]) => sum + lineUnitPrice(l) * l.qty, 0);

    const [quote, setQuote] = useState<CartCheckResult | null>(null);
    // The server works out the discount and shipping; until it answers, fall back to the plain items total.
    // Saved = what a code or offer took off, plus what the running sale prices save against the regular prices.
    const saleSavings = checkedEntries.reduce((sum, [, l]) => sum + lineSaleSavings(l), 0);
    const saved = (quote?.discount ?? 0) + saleSavings;
    const shipping = quote ? quote.shippingFee : null;
    const total = quote ? quote.total : itemsTotal;

    const [removeKey, setRemoveKey] = useState<string | null>(null);
    const removeLineItem = removeKey !== null ? cart[removeKey] : null;
    const removeProduct = removeLineItem ? getProduct(removeLineItem.productId) : null;

    const quoteKey = JSON.stringify(checkedEntries.map(([, l]) => [l.productId, l.sizeId, l.qty]));
    useEffect(() => {
        if (preview || checkedEntries.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing ticked means no quote to show
            setQuote(null);
            return;
        }
        const items = checkedEntries.map(([, l]) => ({ productId: l.productId, sizeId: l.sizeId === null ? null : Number(l.sizeId), qty: l.qty }));
        if (items.some((i) => i.sizeId !== null && !Number.isInteger(i.sizeId))) return;
        let alive = true;
        checkCart(items, getCheckoutVoucher() || undefined)
            .then((r) => alive && setQuote(r))
            .catch(() => alive && setQuote(null));
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- quoteKey stands in for the ticked entries
    }, [quoteKey, preview]);

    function toggle(key: string, on: boolean) {
        setUnchecked((prev) => {
            const next = new Set(prev);
            if (on) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function toggleAll() {
        setUnchecked(allChecked ? new Set(entries.map(([key]) => key)) : new Set());
    }

    function checkout() {
        if (preview || !someChecked) return;
        if (!isLoggedIn) {
            showToast("error", "Sign in to check out.");
            openModal("login");
            return;
        }
        setCheckoutKeys(checkedEntries.map(([key]) => key));
        router.push("/checkout");
    }

    if (!mounted) return <CartSkeleton preview={preview} />;

    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+1.2rem)] pb-32"}>
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
                <>
                    <div className="flex flex-col divide-y divide-ink/10">
                        {entries.map(([key, line]) => {
                            const p = getProduct(line.productId);
                            if (!p) return null;
                            const size = line.sizeId ? p.sizes?.find((s) => s.id === line.sizeId) : undefined;
                            const unitPrice = lineUnitPrice(line);
                            return (
                                <div key={key} className="grid grid-cols-[auto_6.5rem_1fr] items-center gap-x-3 py-7 first:pt-0 last:pb-0 sm:grid-cols-[auto_8rem_1fr] sm:gap-x-5">
                                    <Checkbox checked={!unchecked.has(key)} onChange={(on) => toggle(key, on)} ariaLabel={`Select ${p.title}`} className="-mr-1" />

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

                                    <div className="flex h-full flex-col">
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
                                                    <PriceTag price={(size ?? p).price} salePrice={(size ?? p).salePrice} suffix=" each" />
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setRemoveKey(key)}
                                                aria-label={`Remove ${p.title}`}
                                                className="flex h-11 w-11 flex-none items-center justify-center text-alert/80 transition hover:text-alert"
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
                                            <PriceTag price={(size ?? p).price * line.qty} salePrice={unitPrice * line.qty} stack className="block text-right font-mono text-[16px] font-medium text-ink" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <ActionBar inFlow={preview}>
                        <Checkbox
                            checked={allChecked}
                            indeterminate={someChecked && !allChecked}
                            onChange={toggleAll}
                            label={<span className="text-[13px] font-medium text-ink">All</span>}
                        />

                        <div className="ml-auto">
                            <BarTotal amount={total} saved={saved} shipping={shipping} />
                        </div>

                        <button onClick={checkout} disabled={preview || !someChecked} className={BAR_BUTTON}>
                            Check out ({checkedCount})
                            <BarArrow />
                        </button>
                    </ActionBar>
                </>
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
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+1.2rem)] pb-32"}>
            <SkeletonGroup>
                <div className="mb-8 border-b border-ink/10 pt-[4.75rem] pb-8 md:mb-12 md:pt-[5.5rem] md:pb-10">
                    <Skeleton className="h-[34px] w-[70%] max-w-[520px] sm:h-[42px]" />
                    <Skeleton className="mt-3 h-[34px] w-[45%] max-w-[340px] sm:h-[42px]" />
                </div>

                <div className="mb-8 flex items-center gap-x-4 sm:gap-x-5 md:mb-11">
                    <Skeleton className="h-[10.5px] w-3" />
                    <Skeleton className="h-[10.5px] w-20" />
                    <span className="h-px flex-1 bg-grey-light/40" />
                </div>

                <div className="flex flex-col divide-y divide-ink/10">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-[auto_6.5rem_1fr] items-center gap-x-3 py-7 first:pt-0 last:pb-0 sm:grid-cols-[auto_8rem_1fr] sm:gap-x-5">
                            <Skeleton tone="outline" className="h-[18px] w-[18px]" />
                            <Skeleton tone="faint" className="aspect-[4/5] w-full border border-ink/10" />
                            <div>
                                <Skeleton className="h-[10px] w-16" />
                                <Skeleton className="mt-2 h-[16.5px] w-4/5" />
                                <Skeleton tone="soft" className="mt-2 h-3 w-20" />
                                <div className="mt-5 flex items-end justify-between">
                                    <Skeleton tone="outline" className="h-11 w-28" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SkeletonGroup>
        </div>
    );
}
