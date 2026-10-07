"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore, lineUnitPrice } from "@/library/store";
import { getProduct } from "@/library/products";
import PriceTag from "@/components/ui/PriceTag";
import { useMounted } from "@/library/useMounted";
import { ApiError } from "@/library/api/client";
import { checkCart, placeOrder, submitPaymentProof, type CartCheckResult } from "@/library/api/orders";
import { EMPTY_PAYMENT_INSTRUCTIONS, getPaymentInstructions, PaymentInstructions, PaymentMethodId } from "@/library/api/payments";
import { getCheckoutVoucher, setCheckoutVoucher } from "@/library/checkoutVoucher";
import { lineSaleSavings } from "@/library/savings";
import { useProducts } from "@/library/productsStore";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import { estimateDelivery } from "@/library/delivery";
import ActionBar, { BAR_BUTTON, BarArrow, BarTotal } from "@/components/ui/ActionBar";

const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const field = "w-full border border-ink/15 bg-white p-3 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1";
const label = "mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey";
const heading = "mb-3 font-mono text-[10.5px] uppercase tracking-[.16em] text-grey";

const SHELL = "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+1.2rem)] pb-32";

export default function CheckoutPageView() {
    const { cart, checkoutKeys, setCheckoutKeys, removeLines, checkoutAddress, customerName, isLoggedIn, sessionChecked, openModal, showToast } = useStore();
    const { refresh: refreshCatalog } = useProducts();
    const router = useRouter();
    const mounted = useMounted();

    const entries = checkoutKeys.filter((k) => cart[k]).map((k) => [k, cart[k]] as const);
    const itemsTotal = entries.reduce((sum, [, l]) => sum + lineUnitPrice(l) * l.qty, 0);

    const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
    const [method, setMethod] = useState<PaymentMethodId>("gcash");
    const [reference, setReference] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const picker = useRef<HTMLInputElement>(null);
    const [viewing, setViewing] = useState(false);

    const [codeInput, setCodeInput] = useState("");
    const [appliedCode, setAppliedCode] = useState(() => (typeof window === "undefined" ? "" : getCheckoutVoucher()));
    const [codeError, setCodeError] = useState("");
    const [quote, setQuote] = useState<CartCheckResult | null>(null);
    const [placing, setPlacing] = useState(false);
    const placed = useRef(false);

    const subtotal = quote?.subtotal ?? itemsTotal;
    const discount = quote?.discount ?? 0;
    const shippingFee = quote?.shippingFee ?? 0;
    const total = quote ? quote.total : itemsTotal;
    // Saved = a code or offer's discount plus what the running sale prices save against the regular prices.
    const saved = discount + entries.reduce((sum, [, l]) => sum + lineSaleSavings(l), 0);

    useEffect(() => {
        let alive = true;
        getPaymentInstructions().then((i) => alive && setInstructions(i));
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from an external resource (the object URL)
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    // Nothing ticked in the bag to pay for: back to the bag (but not while an order is being placed).
    useEffect(() => {
        if (mounted && sessionChecked && isLoggedIn && entries.length === 0 && !placed.current) router.replace("/cart");
    }, [mounted, sessionChecked, isLoggedIn, entries.length, router]);

    const quoteKey = JSON.stringify(entries.map(([, l]) => [l.productId, l.sizeId, l.qty]));
    useEffect(() => {
        if (entries.length === 0) return;
        const items = entries.map(([, l]) => ({ productId: l.productId, sizeId: l.sizeId === null ? null : Number(l.sizeId), qty: l.qty }));
        if (items.some((i) => i.sizeId !== null && !Number.isInteger(i.sizeId))) return;
        let alive = true;
        checkCart(items, appliedCode || undefined)
            .then((r) => {
                if (!alive) return;
                setQuote(r);
                // Only a rejection sets the message; the follow-up quote (sent without the rejected code) must not wipe it.
                if (r.voucherError) setCodeError(r.voucherError);
                else if (appliedCode) setCodeError("");
                // A code the server rejected isn't kept, so it can't be sent with the order.
                if (r.voucherError) {
                    setAppliedCode("");
                    setCheckoutVoucher("");
                }
            })
            .catch(() => alive && setQuote(null));
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- quoteKey stands in for the entries
    }, [quoteKey, appliedCode]);

    const methods = (instructions ?? EMPTY_PAYMENT_INSTRUCTIONS).methods.filter((m) => m.accountNumber.trim());
    const configured = methods.length > 0;
    const activeMethod = methods.some((m) => m.id === method) ? method : (methods[0]?.id ?? method);

    function pick(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        if (!ACCEPTED.includes(f.type)) return showToast("error", "Use a JPG, PNG or WEBP screenshot.");
        if (f.size > MAX_BYTES) return showToast("error", "That image is over 3MB. Take a smaller screenshot.");
        setFile(f);
    }

    function removeFile() {
        setFile(null);
        setPreview(null);
        setViewing(false);
    }

    function applyCode() {
        const code = codeInput.trim().toUpperCase();
        if (!code) return;
        setCodeError("");
        setAppliedCode(code);
        setCheckoutVoucher(code);
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (placing) return;
        if (!file) return showToast("error", "Attach your payment screenshot first.");
        if (!checkoutAddress) {
            showToast("error", "Add a delivery address first.");
            router.push("/account/addresses");
            return;
        }
        // Bags saved before the catalogue moved to the server hold string size ids that no longer exist.
        const items = entries.map(([, l]) => ({ productId: l.productId, sizeId: l.sizeId === null ? null : Number(l.sizeId), qty: l.qty }));
        if (items.some((i) => i.sizeId !== null && !Number.isInteger(i.sizeId))) {
            showToast("error", "Some items in your bag are out of date — remove them and add them again.");
            return;
        }

        setPlacing(true);
        let orderNo: string;
        try {
            // The server prices the order and takes the stock in one transaction; nothing here is trusted.
            const { order } = await placeOrder({ items, address: checkoutAddress.text, voucherCode: appliedCode || undefined });
            orderNo = order.no;
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not place your order. Please try again.");
            setPlacing(false);
            void refreshCatalog();
            return;
        }

        placed.current = true;
        removeLines(entries.map(([key]) => key));
        setCheckoutKeys([]);
        setCheckoutVoucher("");
        void refreshCatalog();

        try {
            await submitPaymentProof(orderNo, { method: activeMethod, reference: reference.trim() || undefined, file });
            router.push(`/checkout/success?order=${encodeURIComponent(orderNo)}`);
        } catch (err) {
            // The order exists; let them retry the screenshot from My Purchase rather than losing it.
            showToast("error", err instanceof ApiError ? `Order ${orderNo} was placed, but the screenshot didn't upload: ${err.message}` : `Order ${orderNo} was placed, but the screenshot didn't upload. Please upload it again.`);
            router.push(`/account/purchases?pay=${encodeURIComponent(orderNo)}`);
        }
    }

    if (!mounted || !sessionChecked) return <CheckoutSkeleton />;

    if (!isLoggedIn) {
        return (
            <div className={SHELL}>
                <div className="mx-auto flex max-w-[480px] flex-col items-center gap-5 border border-ink/10 py-16 text-center">
                    <p className="max-w-[300px] text-[13px] leading-relaxed text-grey">Sign in to check out and pay for your order.</p>
                    <button
                        onClick={() => openModal("login")}
                        className="bg-navy px-8 py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark"
                    >
                        Sign in
                    </button>
                </div>
            </div>
        );
    }

    if (entries.length === 0) return <CheckoutSkeleton />;

    const canPlace = !!file && !!checkoutAddress && !placing;
    const estimate = checkoutAddress ? estimateDelivery(checkoutAddress.text) : null;

    return (
        <div className={SHELL}>
            <div>
                <Link href="/cart" className="group mb-6 inline-flex min-h-11 items-center gap-2 text-[12.5px] font-medium text-grey transition-colors hover:text-pink-dark md:mb-8">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                        <path d="M19 12H5M11 18l-6-6 6-6" />
                    </svg>
                    Your bag
                </Link>

                <header className="mb-8 border-b border-ink/10 pb-8 md:mb-10 md:pb-10">
                    <h1 className="m-0 font-display text-[clamp(30px,4.5vw,46px)] leading-[1.05] font-medium tracking-tight text-ink">Check out</h1>
                </header>

                <form id="checkout-form" onSubmit={submit} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
                    <div className="flex flex-col gap-8">
                        <section>
                            <h2 className={heading}>Deliver to</h2>
                            <div className="border border-ink/10">
                                <div className="flex items-start justify-between gap-4 p-5">
                                    <div className="min-w-0">
                                        {checkoutAddress ? (
                                            <>
                                                <div className="text-[14px] font-medium text-ink">{checkoutAddress.label}</div>
                                                {customerName && <div className="mt-0.5 text-[13px] text-ink/80">{customerName}</div>}
                                                <div className="mt-1 text-[13px] leading-relaxed text-grey">{checkoutAddress.text}</div>
                                            </>
                                        ) : (
                                            <div className="text-[13px] text-grey">No delivery address on file.</div>
                                        )}
                                    </div>
                                    <Link href="/account/addresses" className="flex-none font-mono text-[10.5px] uppercase tracking-[.1em] text-pink-dark underline underline-offset-2 transition hover:text-pink-btn">
                                        {checkoutAddress ? "Change" : "Add"}
                                    </Link>
                                </div>

                                {estimate && (
                                    <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ink/10 p-5 sm:grid-cols-3">
                                        <div>
                                            <dt className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">Ships by</dt>
                                            <dd className="m-0 mt-1 text-[13px] text-ink">{estimate.ships}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">Expected delivery</dt>
                                            <dd className="m-0 mt-1 text-[13px] text-ink">{estimate.arrives}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">Shipping</dt>
                                            <dd className="m-0 mt-1 text-[13px] text-ink">{!quote ? "—" : shippingFee > 0 ? `₱${shippingFee.toLocaleString()}` : "Free"}</dd>
                                        </div>
                                        <div className="col-span-2 sm:col-span-3">
                                            <p className="m-0 text-[11.5px] leading-relaxed text-grey">
                                                {estimate.zone} estimate: orders ship within 1–2 business days once your payment is confirmed. Dates are estimates, not a guarantee.
                                            </p>
                                        </div>
                                    </dl>
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className={heading}>Your items</h2>
                            <div className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                                {entries.map(([key, line]) => {
                                    const p = getProduct(line.productId);
                                    if (!p) return null;
                                    const size = line.sizeId ? p.sizes?.find((s) => s.id === line.sizeId) : undefined;
                                    const unitPrice = lineUnitPrice(line);
                                    return (
                                        <div key={key} className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-6 sm:grid-cols-[7rem_1fr] sm:gap-x-5">
                                            <Link href={`/shop/${p.id}`} className="group relative aspect-[4/5] w-full overflow-hidden border border-ink/10 transition hover:border-ink/30">
                                                <Image src={p.image} alt={p.title} fill sizes="112px" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                                            </Link>
                                            <div className="flex min-w-0 flex-col">
                                                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-grey">
                                                    {p.category}
                                                    {size && ` · ${size.label}`}
                                                </span>
                                                <Link href={`/shop/${p.id}`} className="mt-1 block text-[16px] leading-snug font-medium text-ink transition hover:text-pink-dark">
                                                    {p.title}
                                                </Link>
                                                <span className="mt-1.5 block font-mono text-[12px] text-grey"><PriceTag price={(size ?? p).price} salePrice={(size ?? p).salePrice} suffix=" each" /></span>
                                                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                                                    <span className="font-mono text-[12px] text-grey">Qty {line.qty}</span>
                                                    <PriceTag price={(size ?? p).price * line.qty} salePrice={unitPrice * line.qty} stack className="block text-right font-mono text-[16px] font-medium text-ink" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section>
                            <h2 className={heading}>Payment</h2>
                            <div className="border border-ink/10 p-5 sm:p-6">
                                <label htmlFor="co-code" className={label}>Discount code</label>
                                <div>
                                    <div className="flex gap-2">
                                        <input
                                            value={codeInput}
                                            onChange={(e) => {
                                                setCodeInput(e.target.value);
                                                setCodeError("");
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    applyCode();
                                                }
                                            }}
                                            placeholder="Enter a code"
                                            id="co-code"
                                            aria-invalid={!!codeError}
                                            className={`min-w-0 flex-1 border px-3 py-2.5 font-mono text-[12.5px] uppercase text-ink outline-none ${codeError ? "border-alert focus:border-alert" : "border-ink/15 focus:border-pink-btn"}`}
                                        />
                                        <button type="button" onClick={applyCode} className="border border-ink/15 px-4 text-[12px] font-semibold uppercase tracking-wide text-ink transition hover:border-pink-btn hover:text-pink-dark">
                                            Apply
                                        </button>
                                    </div>
                                    {codeError && (
                                        <p role="alert" className="mt-1.5 text-[11.5px] text-alert">
                                            {codeError}
                                        </p>
                                    )}
                                    {quote?.voucher && !codeError && <p className="mt-1.5 text-[11.5px] text-grey">{quote.voucher.description}</p>}
                                </div>
                                <div className="my-5 border-t border-ink/10" />

                                <h3 className="mb-1 text-[18px] font-medium text-ink">Send ₱{total.toLocaleString()}</h3>
                                <p className="mb-5 text-[12.5px] leading-relaxed text-grey">{(instructions ?? EMPTY_PAYMENT_INSTRUCTIONS).intro}</p>

                                {instructions && !configured && (
                                    <p className="mb-5 border-l-2 border-pink-dark bg-pink-soft/40 px-3 py-2 text-[12.5px] text-ink">
                                        Payment details haven&apos;t been set up yet. Please contact us and we&apos;ll tell you where to send your payment.
                                    </p>
                                )}

                                {configured && (
                                    <div className="mb-5 flex flex-col gap-2">
                                        {methods.map((m) => (
                                            <div key={m.id} className={`border p-3.5 ${m.id === activeMethod ? "border-navy" : "border-ink/10"}`}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-[13px] font-medium text-ink">{m.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigator.clipboard.writeText(m.accountNumber).then(() => showToast("success", "Number copied."))}
                                                        className="text-[11.5px] text-pink-dark underline underline-offset-2"
                                                    >
                                                        Copy number
                                                    </button>
                                                </div>
                                                <div className="mt-1 font-mono text-[13px] text-ink">{m.accountNumber}</div>
                                                {m.accountName && <div className="text-[12px] text-grey">{m.accountName}</div>}
                                                {m.notes && <div className="mt-1 text-[11.5px] text-grey">{m.notes}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="co-method" className={label}>I paid with</label>
                                        <select id="co-method" value={activeMethod} onChange={(e) => setMethod(e.target.value as PaymentMethodId)} className={field}>
                                            {(configured ? methods : EMPTY_PAYMENT_INSTRUCTIONS.methods).map((m) => (
                                                <option key={m.id} value={m.id}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="co-ref" className={label}>Reference no.</label>
                                        <input id="co-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} placeholder="Optional" className={field} />
                                    </div>
                                </div>

                                <span className={label}>Screenshot of your receipt</span>
                                <input ref={picker} type="file" accept={ACCEPTED.join(",")} onChange={pick} className="hidden" />
                                {file && preview ? (
                                    <div className="flex items-center gap-3 border border-ink/15 p-3">
                                        <button
                                            type="button"
                                            onClick={() => setViewing(true)}
                                            aria-label="View your screenshot"
                                            className="group relative h-16 w-16 flex-none overflow-hidden border border-ink/10 focus-visible:ring-2 focus-visible:ring-navy"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={preview} alt="Your payment screenshot" className="h-full w-full object-cover" />
                                            <span className="absolute inset-0 flex items-center justify-center bg-navy/55 text-[10.5px] font-semibold tracking-wide text-white uppercase opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                                                View
                                            </span>
                                        </button>
                                        <span className="min-w-0 flex-1 text-[12.5px] text-ink">
                                            <span className="block truncate">{file.name}</span>
                                            <button type="button" onClick={() => picker.current?.click()} className="text-[12px] text-grey underline underline-offset-2 transition hover:text-ink">
                                                Change image
                                            </button>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            aria-label="Remove screenshot"
                                            className="flex h-11 w-11 flex-none items-center justify-center border border-ink/15 text-alert transition hover:border-alert hover:bg-alert/5 focus-visible:ring-2 focus-visible:ring-navy"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                                <path d="M6 6l12 12M18 6 6 18" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => picker.current?.click()}
                                        className="flex w-full items-center gap-4 border border-dashed border-ink/25 p-3 text-left transition hover:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy"
                                    >
                                        <span className="py-3 text-[12.5px] text-grey">Choose a JPG, PNG or WEBP image (max 3MB)</span>
                                    </button>
                                )}
                            </div>
                        </section>
                    </div>

                    <aside className="lg:sticky lg:top-[calc(var(--navbar-h,68px)+24px)]">
                        <h2 className={heading}>Order summary</h2>
                        <div className="border border-ink/10 p-5 sm:p-6">
                            <div className="flex items-center justify-between text-[13px] text-grey">
                                <span>Subtotal</span>
                                <span className="font-mono text-ink">₱{subtotal.toLocaleString()}</span>
                            </div>
                            {discount > 0 && (
                                <div className="mt-2.5 flex items-center justify-between text-[13px] text-grey">
                                    <span>Discount{appliedCode ? ` · ${appliedCode}` : ""}</span>
                                    <span className="font-mono text-ink">−₱{discount.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </aside>
                </form>

                <ActionBar>
                    <div className="mr-auto min-w-0">
                        <BarTotal amount={total} saved={saved} shipping={quote ? shippingFee : null} note={!file ? "Upload your payment screenshot to place your order." : !checkoutAddress ? "Add a delivery address to place your order." : undefined} />
                    </div>
                    <button type="submit" form="checkout-form" disabled={!canPlace} className={BAR_BUTTON}>
                        {placing ? "Placing Order…" : "Place Order"}
                        {!placing && <BarArrow />}
                    </button>
                </ActionBar>

                <Modal open={viewing && !!preview} onClose={() => setViewing(false)} maxWidth="max-w-[560px]" title="Your payment screenshot">
                    <div className="p-3 sm:p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {preview && <img src={preview} alt="Your payment screenshot" className="max-h-[75vh] w-full object-contain" />}
                    </div>
                </Modal>
            </div>
        </div>
    );
}

// Section heading placeholder, sized to the 10.5px mono `heading` label.
function HeadingBar({ width = "w-24" }: { width?: string }) {
    return (
        <div className="mb-3 flex h-4 items-center">
            <Skeleton tone="soft" className={`h-[10.5px] ${width}`} />
        </div>
    );
}

function CheckoutSkeleton() {
    return (
        <div className={SHELL}>
            <SkeletonGroup>
                <div className="mb-6 flex min-h-11 items-center md:mb-8">
                    <Skeleton className="h-[12.5px] w-20" />
                </div>

                <div className="mb-8 border-b border-ink/10 pb-8 md:mb-10 md:pb-10">
                    <Skeleton className="h-[32px] w-48 sm:h-[40px] lg:h-[48px]" />
                </div>

                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
                    <div className="flex flex-col gap-8">
                        <div>
                            <HeadingBar width="w-20" />
                            <div className="border border-ink/10">
                                <div className="flex items-start justify-between gap-4 p-5">
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-[14px] w-24" />
                                        <Skeleton tone="soft" className="h-[13px] w-32" />
                                        <Skeleton tone="soft" className="h-[13px] w-56 max-w-full" />
                                    </div>
                                    <Skeleton tone="soft" className="h-[10.5px] w-12 flex-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ink/10 p-5 sm:grid-cols-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex flex-col gap-2">
                                            <Skeleton tone="soft" className="h-[10px] w-16" />
                                            <Skeleton className="h-[13px] w-20" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <HeadingBar width="w-20" />
                            <div className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-6 sm:grid-cols-[7rem_1fr] sm:gap-x-5">
                                        <Skeleton tone="faint" className="aspect-[4/5] w-full border border-ink/10" />
                                        <div className="flex min-w-0 flex-col">
                                            <Skeleton className="h-[10px] w-16" />
                                            <Skeleton className="mt-2 h-4 w-3/5" />
                                            <Skeleton tone="soft" className="mt-2 h-3 w-20" />
                                            <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                                                <Skeleton tone="soft" className="h-3 w-10" />
                                                <Skeleton className="h-4 w-16" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <HeadingBar width="w-16" />
                            <div className="border border-ink/10 p-5 sm:p-6">
                                <Skeleton tone="soft" className="mb-1.5 h-[11px] w-28" />
                                <div className="flex gap-2">
                                    <Skeleton tone="outline" className="h-[44px] flex-1" />
                                    <Skeleton tone="outline" className="h-[44px] w-[72px]" />
                                </div>
                                <div className="my-5 border-t border-ink/10" />
                                <Skeleton className="mb-3 h-[18px] w-40" />
                                <Skeleton tone="soft" className="mb-1.5 h-3 w-full" />
                                <Skeleton tone="soft" className="mb-5 h-3 w-3/5" />
                                <div className="mb-5 flex flex-col gap-2">
                                    <Skeleton tone="outline" className="h-[76px] w-full" />
                                    <Skeleton tone="outline" className="h-[76px] w-full" />
                                </div>
                                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                        <div key={i}>
                                            <Skeleton tone="soft" className="mb-1.5 h-[11px] w-24" />
                                            <Skeleton tone="outline" className="h-[46px] w-full" />
                                        </div>
                                    ))}
                                </div>
                                <Skeleton tone="soft" className="mb-1.5 h-[11px] w-40" />
                                <Skeleton tone="outline" className="h-[72px] w-full" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <HeadingBar width="w-28" />
                        <div className="border border-ink/10 p-5 sm:p-6">
                            <div className="flex items-center justify-between">
                                <Skeleton tone="soft" className="h-[13px] w-16" />
                                <Skeleton className="h-[13px] w-16" />
                            </div>
                        </div>
                    </div>
                </div>

                <ActionBar>
                    <div className="mr-auto">
                        <Skeleton className="h-[18px] w-28" />
                        <Skeleton tone="soft" className="mt-1.5 h-[10.5px] w-24" />
                    </div>
                    <Skeleton tone="outline" className="h-11 w-36 flex-none" />
                </ActionBar>
            </SkeletonGroup>
        </div>
    );
}
