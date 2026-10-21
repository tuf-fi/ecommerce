"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore, lineUnitPrice, MAX_PER_ITEM } from "@/library/store";
import { PRODUCTS, getProduct } from "@/library/products";
import PriceTag from "@/components/ui/PriceTag";
import SectionTitle from "@/components/ui/SectionTitle";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Checkbox from "@/components/ui/Checkbox";
import ActionBar, { BAR_BUTTON, BarArrow, BarTotal } from "@/components/ui/ActionBar";
import PageIntro from "@/components/sections/PageIntro";
import { PageIntroContent } from "@/library/content";
import { useMounted } from "@/library/useMounted";
import { checkCart, type CartCheckResult } from "@/library/api/orders";
import { getCheckoutVoucher, setCheckoutVoucher } from "@/library/checkoutVoucher";
import { lineSaleSavings } from "@/library/savings";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import EmptyPicks from "@/components/ui/EmptyPicks";
import { ASIDE_CLASS_RIGHT, ASIDE_STICKY_ABOVE_BAR, HEADER_LABEL, HEADER_ROW, PAGE_COLUMN, SHELL_GRID_RIGHT, SHELL_WRAPPER } from "@/components/ui/sidebar";

const ESTIMATE_NOTE = "Estimate only. Shipping and offers are confirmed at checkout.";

// `preview`/`introPreviewData`: the admin's Cart-intro editor embeds this real page so admins see the intro in
// context — only the intro headline/accent are actually editable here. Everything else renders like the real page,
// except the checkout bar: a real `position: fixed` bar would escape the admin's preview column and float over
// unrelated admin chrome, so preview keeps it in normal flow and disables checkout.
export default function CartPageView({ preview = false, introPreviewData }: { preview?: boolean; introPreviewData?: PageIntroContent } = {}) {
    const { cart, changeQty, removeLine, cartCount, isLoggedIn, openModal, showToast, setCheckoutKeys, wishlist, toggleWishlist } = useStore();
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
    const [voucher, setVoucher] = useState(() => getCheckoutVoucher());
    // The server works out the discount and shipping; until it answers, fall back to the plain items total.
    // Saved = what a code or offer took off, plus what the running sale prices save against the regular prices.
    const saleSavings = checkedEntries.reduce((sum, [, l]) => sum + lineSaleSavings(l), 0);
    const saved = (quote?.discount ?? 0) + saleSavings;
    const shipping = quote ? quote.shippingFee : null;
    // How far the bag is from free shipping, when the shop offers it.
    const toFreeShipping = quote && quote.freeShippingOver !== null && quote.shippingFee > 0 ? Math.max(0, quote.freeShippingOver - quote.subtotal) : 0;
    const freeShippingHint = toFreeShipping > 0 ? `Add ₱${toFreeShipping.toLocaleString()} more for free shipping.` : null;
    const total = quote ? quote.total : itemsTotal;
    const estimated = !preview && someChecked && !quote;

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
        checkCart(items, voucher || undefined)
            .then((r) => {
                if (!alive) return;
                setQuote(r);
                if (r.voucherError) {
                    setVoucher("");
                    setCheckoutVoucher("");
                }
            })
            .catch(() => alive && setQuote(null));
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- quoteKey stands in for the ticked entries
    }, [quoteKey, preview, voucher]);

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

    // Other categories that share a concern with what's in the bag, so the suggestions complement rather than repeat.
    const bagIds = new Set(entries.map(([, l]) => l.productId));
    const bagCategories = new Set(entries.map(([, l]) => getProduct(l.productId)?.category));
    const bagConcerns = new Set(entries.flatMap(([, l]) => getProduct(l.productId)?.concerns ?? []));
    const related = PRODUCTS.filter((p) => !bagIds.has(p.id) && p.stock > 0 && !bagCategories.has(p.category) && p.concerns?.some((c) => bagConcerns.has(c)))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);

    function moveToWishlist(key: string, productId: number) {
        if (!wishlist.includes(productId)) toggleWishlist(productId);
        removeLine(key);
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

    const intro = <PageIntro pageKey="cart" previewData={introPreviewData} rule={false} />;
    const title = <SectionTitle num="—" title={`${cartCount} Item${cartCount === 1 ? "" : "s"}`} />;

    return (
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : SHELL_WRAPPER}>
            {entries.length === 0 ? (
                <div className={preview ? "" : `${PAGE_COLUMN} border-t border-ink/10`}>
                {intro}
                {title}
                <EmptyState title="Your bag is empty" message="Browse the catalogue and add a formula or two." action={!preview ? { label: "Browse the catalogue", href: "/shop" } : undefined} />
                {!preview && <EmptyPicks />}
                </div>
            ) : (
                <>
                    <div className={preview ? "lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-14" : SHELL_GRID_RIGHT}>
                    <div className={preview ? "min-w-0" : PAGE_COLUMN.replace("pb-20", "pb-36")}>
                    {intro}
                    {title}
                    <div className="flex flex-col divide-y divide-ink/10">
                        {entries.map(([key, line]) => {
                            const p = getProduct(line.productId);
                            if (!p) return null;
                            const size = line.sizeId ? p.sizes?.find((s) => s.id === line.sizeId) : undefined;
                            const unitPrice = lineUnitPrice(line);
                            const available = size ? size.stock : p.sizes?.length ? 0 : p.stock;
                            const inBagForProduct = entries.filter(([, l]) => l.productId === p.id).reduce((sum, [, l]) => sum + l.qty, 0);
                            const atLimit = line.qty >= available || inBagForProduct >= MAX_PER_ITEM;
                            const stockNote = available <= 0 ? "Out of stock" : line.qty >= available ? `Only ${available} left` : available <= 5 ? `${available} left` : inBagForProduct >= MAX_PER_ITEM ? `Limit ${MAX_PER_ITEM} per order` : null;
                            return (
                                <div key={key} className="grid grid-cols-[auto_5rem_1fr] items-center gap-x-3 py-7 first:pt-0 last:pb-0 sm:grid-cols-[auto_8rem_1fr] sm:gap-x-5">
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
                                                <span className="font-mono text-label uppercase tracking-[.16em] text-grey">
                                                    {p.category}
                                                    {size && ` · ${size.label}`}
                                                </span>
                                                <Link
                                                    href={`/shop/${p.id}`}
                                                    className="mt-1 block text-left text-lead font-medium leading-snug text-ink transition hover:text-pink-dark"
                                                >
                                                    {p.title}
                                                </Link>
                                                <span className="mt-1.5 block font-mono text-meta text-grey">
                                                    <PriceTag price={(size ?? p).price} salePrice={(size ?? p).salePrice} suffix=" each" />
                                                </span>
                                                {stockNote && <span className={`mt-1.5 block font-mono text-label ${available <= 0 ? "text-alert" : "text-amber-dark"}`}>{stockNote}</span>}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 text-meta text-grey">
                                            {!wishlist.includes(p.id) && (
                                                <button onClick={() => moveToWishlist(key, p.id)} className="min-h-11 underline underline-offset-4 transition hover:text-ink">
                                                    Move to wishlist
                                                </button>
                                            )}
                                            <button onClick={() => setRemoveKey(key)} aria-label={`Remove ${p.title}`} className="min-h-11 underline underline-offset-4 transition hover:text-alert">
                                                Remove
                                            </button>
                                        </div>

                                        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
                                            <div className="flex items-center border border-ink/15">
                                                <button onClick={() => changeQty(key, -1)} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-off">–</button>
                                                <span className="w-8 text-center text-small">{line.qty}</span>
                                                <button
                                                    onClick={() => changeQty(key, 1)}
                                                    disabled={atLimit}
                                                    aria-label="Increase quantity"
                                                    className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-off disabled:cursor-not-allowed disabled:text-grey/50 disabled:hover:bg-transparent"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <PriceTag price={(size ?? p).price * line.qty} salePrice={unitPrice * line.qty} stack className="block text-right font-mono text-lead font-medium text-ink" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!preview && related.length > 0 && <EmptyPicks title="Goes with your bag" products={related} />}
                    </div>

                    <aside className={preview ? "mt-10 hidden border border-ink/10 lg:mt-0 lg:block" : ASIDE_CLASS_RIGHT}>
                        <div className={preview ? "p-6" : ASIDE_STICKY_ABOVE_BAR}>
                        <div className={HEADER_ROW}>
                            <span className={HEADER_LABEL}>Summary</span>
                        </div>
                        <dl className="mt-4 flex flex-col gap-3 font-mono text-meta text-ink">
                            <div className="flex justify-between gap-4">
                                <dt className="text-grey">Items ({checkedCount})</dt>
                                <dd>₱{(itemsTotal + saleSavings).toLocaleString()}</dd>
                            </div>
                            {saved > 0 && (
                                <div className="flex justify-between gap-4 text-success-dark">
                                    <dt>Saved</dt>
                                    <dd>−₱{saved.toLocaleString()}</dd>
                                </div>
                            )}
                            <div className="flex justify-between gap-4">
                                <dt className="text-grey">Shipping</dt>
                                <dd className={shipping === 0 ? "text-success-dark" : undefined}>{shipping === null ? "At checkout" : shipping > 0 ? `₱${shipping.toLocaleString()}` : "Free"}</dd>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-ink/10 pt-4">
                                <dt className="text-label uppercase tracking-[.16em] text-grey">Total</dt>
                                <dd className="text-subhead font-semibold">₱{total.toLocaleString()}</dd>
                            </div>
                        </dl>
                        {freeShippingHint && <p className="mt-4 mb-0 text-meta leading-snug text-ink">{freeShippingHint}</p>}
                        {estimated && <p className="mt-4 text-label leading-snug text-grey">{ESTIMATE_NOTE}</p>}
                        </div>
                    </aside>
                    </div>

                    <ActionBar inFlow={preview}>
                        <Checkbox
                            checked={allChecked}
                            indeterminate={someChecked && !allChecked}
                            onChange={toggleAll}
                            label={<span className="text-small font-medium text-ink">All</span>}
                        />

                        <div className="ml-auto lg:hidden">
                            <BarTotal amount={total} saved={saved} shipping={shipping} note={freeShippingHint ?? undefined} />
                        </div>
                        <div className="ml-auto hidden lg:block">
                            <span className="font-mono text-label uppercase tracking-[.16em] text-grey">Total </span>
                            <span className="font-mono text-title font-semibold text-ink">₱{total.toLocaleString()}</span>
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
        <div className={preview ? "bg-white px-8 pt-8 pb-16" : SHELL_WRAPPER}>
            <SkeletonGroup>
                <div className={preview ? "grid lg:grid-cols-[1fr_320px] lg:gap-14" : SHELL_GRID_RIGHT}>
                    <div className={preview ? "min-w-0" : PAGE_COLUMN}>
                        <div className="mb-10 pt-[1.2rem] md:mb-14">
                            <Skeleton className="mb-8 h-[10.5px] w-20 md:mb-10" />
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
                                <div key={i} className="grid grid-cols-[auto_5rem_1fr] items-center gap-x-3 py-7 first:pt-0 last:pb-0 sm:grid-cols-[auto_8rem_1fr] sm:gap-x-5">
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
                    </div>

                    <div className="hidden border-l border-ink/10 px-6 pt-[1.2rem] lg:block">
                        <div className="flex min-h-11 items-center">
                            <Skeleton tone="faint" className="h-[10.5px] w-16" />
                        </div>
                        <div className="mt-4 flex flex-col gap-3">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton tone="soft" className="h-3 w-20" />
                                    <Skeleton className="h-3 w-14" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SkeletonGroup>
        </div>
    );
}
