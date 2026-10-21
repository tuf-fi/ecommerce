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
import { formatPhone, normalizePhone, PHONE_ERROR } from "@/library/phone";
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

const field = "ui-input";
const label = "ui-label";
const heading = "mb-3 font-mono text-label uppercase tracking-[.16em] text-grey";

const SHELL = "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] min-h-screen bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+1.2rem)] pb-32";

export default function CheckoutPageView() {
    const { cart, checkoutKeys, setCheckoutKeys, removeLines, checkoutAddress, customerName, customerPhone, isLoggedIn, sessionChecked, openModal, showToast } = useStore();
    const { refresh: refreshCatalog } = useProducts();
    const router = useRouter();
    const mounted = useMounted();

    const entries = checkoutKeys.filter((k) => cart[k]).map((k) => [k, cart[k]] as const);
    const itemsTotal = entries.reduce((sum, [, l]) => sum + lineUnitPrice(l) * l.qty, 0);

    const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
    const [instructionsFailed, setInstructionsFailed] = useState(false);
    const [instructionsTick, setInstructionsTick] = useState(0);
    const [method, setMethod] = useState<PaymentMethodId>("gcash");
    const [reference, setReference] = useState("");
    const [showRef, setShowRef] = useState(false);
    // null until edited, so the saved profile number shows without a sync effect.
    const [phoneInput, setPhoneInput] = useState<string | null>(null);
    const [phoneTouched, setPhoneTouched] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const picker = useRef<HTMLInputElement>(null);
    const [viewing, setViewing] = useState(false);

    const [appliedCode, setAppliedCode] = useState(() => (typeof window === "undefined" ? "" : getCheckoutVoucher()));
    const [codeError, setCodeError] = useState("");
    const [codeInput, setCodeInput] = useState("");
    const [quote, setQuote] = useState<CartCheckResult | null>(null);
    const [quoteFailed, setQuoteFailed] = useState(false);
    const [quoteTick, setQuoteTick] = useState(0);
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
        getPaymentInstructions()
            .then((i) => {
                if (!alive) return;
                setInstructions(i);
                setInstructionsFailed(false);
            })
            .catch(() => alive && setInstructionsFailed(true));
        return () => {
            alive = false;
        };
    }, [instructionsTick]);

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
                setQuoteFailed(false);
                // Only a rejection sets the message; the follow-up quote (sent without the rejected code) must not wipe it.
                if (r.voucherError) setCodeError(r.voucherError);
                else if (appliedCode) setCodeError("");
                // A code the server rejected isn't kept, so it can't be sent with the order.
                if (r.voucherError) {
                    setAppliedCode("");
                    setCheckoutVoucher("");
                }
            })
            .catch(() => {
                if (!alive) return;
                setQuote(null);
                setQuoteFailed(true);
            });
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- quoteKey stands in for the entries
    }, [quoteKey, appliedCode, quoteTick]);

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

    const defaultPhone = checkoutAddress?.phone ?? customerPhone;
    const phoneValue = phoneInput ?? (defaultPhone ? formatPhone(defaultPhone) : "");
    const phoneNormalized = normalizePhone(phoneValue);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (placing) return;
        // The button is disabled in these cases; repeat the checks so no other submit path can skip them.
        if (!quote) return showToast("error", "We couldn't confirm your price yet. Try again in a moment.");
        if (!configured) return showToast("error", "Payment details aren't available yet.");
        if (!file) return showToast("error", "Attach your payment screenshot first.");
        if (!checkoutAddress) {
            showToast("error", "Add a delivery address first.");
            router.push("/account/addresses");
            return;
        }
        if (!phoneNormalized) {
            setPhoneTouched(true);
            document.getElementById("checkout-phone")?.focus();
            return showToast("error", phoneValue.trim() ? PHONE_ERROR : "Add a mobile number so the courier can reach you.");
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
            const { order } = await placeOrder({ items, address: checkoutAddress.text, phone: phoneNormalized, voucherCode: appliedCode || undefined });
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
        const bagEntries = Object.values(cart);
        const bagCount = bagEntries.reduce((n, l) => n + l.qty, 0);
        const bagTotal = bagEntries.reduce((sum, l) => sum + lineUnitPrice(l) * l.qty, 0);
        return (
            <div className={SHELL}>
                <Link href="/cart" className="group mb-6 inline-flex min-h-11 items-center gap-2 text-meta font-medium text-grey transition-colors hover:text-pink-dark md:mb-8">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                        <path d="M19 12H5M11 18l-6-6 6-6" />
                    </svg>
                    Your bag
                </Link>
                <CheckoutTitle />
                <div className="max-w-[520px] border border-ink/10 bg-white p-5 shadow-[0_2px_4px_rgba(61,90,115,.06),0_12px_28px_-8px_rgba(61,90,115,.18)] sm:p-6">
                    <h2 className={heading}>Sign in to continue</h2>
                    <p className="m-0 mb-5 text-small leading-relaxed text-grey">
                        {bagCount > 0
                            ? `Your bag (${bagCount} item${bagCount === 1 ? "" : "s"}, about ₱${bagTotal.toLocaleString()}) is saved. Sign in or create an account to pay for it.`
                            : "Sign in or create an account to check out and pay for your order."}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button type="button" onClick={() => openModal("login")} className="ui-btn ui-btn-primary">
                            Sign in
                        </button>
                        <Link href={bagCount > 0 ? "/cart" : "/shop"} className="ui-btn ui-btn-secondary">
                            {bagCount > 0 ? "Back to your bag" : "Browse the catalogue"}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (entries.length === 0) return <CheckoutSkeleton />;

    function applyCode() {
        const code = codeInput.trim().toUpperCase();
        if (!code) return;
        setCodeError("");
        setAppliedCode(code);
        setCheckoutVoucher(code);
        setCodeInput("");
    }

    const canPlace = !!file && !!checkoutAddress && !!phoneNormalized && !!quote && configured && !placing;
    const estimate = checkoutAddress ? estimateDelivery(checkoutAddress.text) : null;

    return (
        <div className={SHELL}>
            <div>
                <Link href="/cart" className="group mb-6 inline-flex min-h-11 items-center gap-2 text-meta font-medium text-grey transition-colors hover:text-pink-dark md:mb-8">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                        <path d="M19 12H5M11 18l-6-6 6-6" />
                    </svg>
                    Your bag
                </Link>

                <CheckoutTitle />

                <form id="checkout-form" onSubmit={submit} className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
                    <div className="flex flex-col gap-10">
                        <section>
                    <h2 className={heading}>Order summary</h2>
                    <div className="border border-ink/10 bg-white p-4 shadow-[0_2px_4px_rgba(61,90,115,.06),0_12px_28px_-8px_rgba(61,90,115,.18)] sm:p-5">
                        <ul className="m-0 mb-4 flex list-none flex-col divide-y divide-ink/10 border-b border-ink/10 p-0">
                            {entries.map(([key, line]) => {
                                const p = getProduct(line.productId);
                                if (!p) return null;
                                const size = line.sizeId ? p.sizes?.find((sz) => sz.id === line.sizeId) : undefined;
                                return (
                                    <li key={key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-4">
                                        <Link href={`/shop/${p.id}`} className="relative h-[70px] w-14 flex-none overflow-hidden border border-ink/10">
                                            <Image src={p.image} alt={p.title} fill sizes="56px" className="object-cover" />
                                        </Link>
                                        <div className="min-w-0 flex-1">
                                            <Link href={`/shop/${p.id}`} className="block truncate text-small font-medium text-ink transition hover:text-pink-dark">
                                                {p.title}
                                            </Link>
                                            <span className="mt-0.5 block font-mono text-label text-grey">
                                                {size ? `${size.label} · ` : ""}Qty {line.qty}
                                            </span>
                                        </div>
                                        <PriceTag price={(size ?? p).price * line.qty} salePrice={lineUnitPrice(line) * line.qty} stack className="block flex-none text-right font-mono text-small text-ink" />
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="flex items-center justify-between text-small text-grey">
                            <span>Subtotal</span>
                            <span className="font-mono text-ink">{quote ? `₱${subtotal.toLocaleString()}` : "—"}</span>
                        </div>
                        {discount > 0 && (
                            <div className="mt-2.5 flex items-center justify-between text-small text-grey">
                                <span>Discount{appliedCode ? ` · ${appliedCode}` : ""}</span>
                                <span className="font-mono text-success-dark">−₱{discount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="mt-2.5 flex items-center justify-between text-small text-grey">
                            <span>Shipping</span>
                            <span className={`font-mono ${quote && shippingFee <= 0 ? "text-success-dark" : "text-ink"}`}>{!quote ? (quoteFailed ? "Unavailable" : "…") : shippingFee > 0 ? `₱${shippingFee.toLocaleString()}` : "Free"}</span>
                        </div>
                        <div className="mt-4 border-t border-ink/10 pt-4">
                            {appliedCode && !codeError ? (
                                <div className="flex items-center justify-between gap-3 text-meta">
                                    <span className="min-w-0 text-ink">
                                        <span className="font-mono">{appliedCode}</span> applied
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAppliedCode("");
                                            setCheckoutVoucher("");
                                        }}
                                        className="min-h-11 flex-none text-grey underline underline-offset-4 transition hover:text-ink"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <>
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
                                            placeholder="Discount code"
                                            aria-label="Discount code"
                                            className={`ui-input h-11 min-w-0 flex-1 py-0 font-mono uppercase placeholder:normal-case ${codeError ? "ui-input-invalid" : ""}`}
                                        />
                                        <button type="button" onClick={applyCode} disabled={!codeInput.trim()} className="ui-btn ui-btn-primary ui-btn-sm flex-none">
                                            Apply
                                        </button>
                                    </div>
                                    {codeError && (
                                        <p role="alert" className="ui-error m-0">
                                            {codeError}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                        {quoteFailed && (
                            <p role="alert" className="m-0 mt-3 text-meta leading-snug text-alert">
                                We couldn&apos;t confirm your price just now.{" "}
                                <button type="button" onClick={() => setQuoteTick((n) => n + 1)} className="inline-flex min-h-11 items-center underline underline-offset-4">
                                    Try again
                                </button>
                            </p>
                        )}
                        <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
                            <span className="font-mono text-label uppercase tracking-[.16em] text-grey">Total</span>
                            <span className="font-mono text-subhead font-semibold text-ink">{quote ? `₱${total.toLocaleString()}` : "—"}</span>
                        </div>
                        <p className="m-0 mt-4 text-label leading-relaxed text-grey">
                            <Link href="/pages/shipping-returns" className="tap-area underline underline-offset-4">Shipping &amp; returns</Link>
                        </p>
                    </div>

                    </section>

                        <section>
                    <h2 className={heading}>Payment</h2>
                    <div className="border border-ink/10 bg-white shadow-[0_2px_4px_rgba(61,90,115,.06),0_12px_28px_-8px_rgba(61,90,115,.18)] p-4 sm:p-5">
                        <p className="m-0 mb-4 text-small leading-relaxed text-ink">
                            {quote ? (
                                <>
                                    Send <span className="font-mono font-semibold">₱{total.toLocaleString()}</span>, then attach your receipt.
                                </>
                            ) : (
                                "Send the total once it is confirmed."
                            )}
                        </p>

                        {instructionsFailed && (
                            <p role="alert" className="mb-4 border border-alert/30 bg-alert/5 px-3 py-2 text-meta text-ink">
                                We couldn&apos;t load the payment details.{" "}
                                <button type="button" onClick={() => setInstructionsTick((n) => n + 1)} className="inline-flex min-h-11 items-center underline underline-offset-4">
                                    Try again
                                </button>
                            </p>
                        )}

                        {instructions && !configured && (
                            <p className="mb-4 border border-pink-dark/30 bg-pink-soft/40 px-3 py-2 text-meta text-ink">
                                Payment details haven&apos;t been set up yet. Email <a href="mailto:hello@cindyrella.ph" className="tap-area underline underline-offset-4">hello@cindyrella.ph</a> and we&apos;ll tell you where to send your payment.
                            </p>
                        )}

                        {configured && (
                            <fieldset className="m-0 mb-4 flex flex-col gap-2 border-0 p-0">
                                <legend className="sr-only">I paid with</legend>
                                {methods.map((m) => {
                                    const active = m.id === activeMethod;
                                    return (
                                        <label key={m.id} className={`flex cursor-pointer items-center justify-between gap-3 border px-3 py-2.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy ${active ? "border-navy" : "border-ink/10 hover:border-ink/30"}`}>
                                            <input type="radio" name="co-method" value={m.id} checked={active} onChange={() => setMethod(m.id)} className="sr-only" />
                                            <span className="min-w-0">
                                                <span className="block text-small font-medium text-ink">{m.label}</span>
                                                <span className="block font-mono text-meta text-ink">{m.accountNumber}</span>
                                                {(m.accountName || m.notes) && <span className="block text-label text-grey">{[m.accountName, m.notes].filter(Boolean).join(" · ")}</span>}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigator.clipboard.writeText(m.accountNumber).then(() => showToast("success", "Number copied."));
                                                }}
                                                className="inline-flex min-h-11 flex-none items-center px-1 text-label text-pink-dark underline underline-offset-2"
                                            >
                                                Copy
                                            </button>
                                        </label>
                                    );
                                })}
                            </fieldset>
                        )}

                        <input ref={picker} type="file" accept={ACCEPTED.join(",")} onChange={pick} className="hidden" />
                        {file && preview ? (
                            <div className="flex items-center gap-3 border border-ink/15 p-2.5">
                                <button
                                    type="button"
                                    onClick={() => setViewing(true)}
                                    aria-label="View your screenshot"
                                    className="h-12 w-12 flex-none overflow-hidden border border-ink/10 focus-visible:ring-2 focus-visible:ring-navy"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview} alt="Your payment screenshot" className="h-full w-full object-cover" />
                                </button>
                                <span className="min-w-0 flex-1 text-meta text-ink">
                                    <span className="block truncate">{file.name}</span>
                                    <button type="button" onClick={() => picker.current?.click()} className="inline-flex min-h-11 items-center text-label text-grey underline underline-offset-2 transition hover:text-ink">
                                        Change
                                    </button>
                                </span>
                                <button type="button" onClick={removeFile} aria-label="Remove screenshot" className="flex h-11 w-11 flex-none items-center justify-center text-grey transition hover:text-alert focus-visible:ring-2 focus-visible:ring-navy">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                        <path d="M6 6l12 12M18 6 6 18" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => picker.current?.click()}
                                className="flex min-h-12 w-full items-center justify-center gap-2 border border-dashed border-ink/25 px-3 text-meta text-grey transition hover:border-navy hover:text-ink focus-visible:ring-2 focus-visible:ring-navy"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="5" width="18" height="14" rx="1.5" />
                                    <circle cx="9" cy="11" r="2" />
                                    <path d="m21 16-5-5L5 19" />
                                </svg>
                                Attach receipt screenshot
                            </button>
                        )}

                        {showRef || reference ? (
                            <div className="mt-3">
                                <label htmlFor="co-ref" className={label}>Reference no.</label>
                                <input id="co-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} placeholder="Optional" className={field} />
                            </div>
                        ) : (
                            <button type="button" onClick={() => setShowRef(true)} className="mt-1 inline-flex min-h-11 items-center text-meta text-grey underline underline-offset-4 transition hover:text-ink">
                                Add reference no.
                            </button>
                        )}
                    </div>
                    </section>
                    </div>

                    <aside className="order-first lg:sticky lg:top-[calc(var(--promo-h,0px)+var(--navbar-h,68px)+24px)] lg:order-last">
                    <section>
                        <h2 className={heading}>Deliver to</h2>
                        <div className="border border-ink/10 bg-white p-4 shadow-[0_2px_4px_rgba(61,90,115,.06),0_12px_28px_-8px_rgba(61,90,115,.18)] sm:p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    {checkoutAddress ? (
                                        <>
                                            <div className="text-small font-medium text-ink">
                                                {checkoutAddress.label}
                                                {customerName && <span className="font-normal text-grey"> · {customerName}</span>}
                                            </div>
                                            <div className="mt-0.5 text-small leading-relaxed text-grey">{checkoutAddress.text}</div>
                                        </>
                                    ) : (
                                        <div className="text-small text-grey">No delivery address on file.</div>
                                    )}
                                </div>
                                <Link href="/account/addresses" className="inline-flex min-h-11 flex-none items-center font-mono text-label uppercase tracking-[.1em] text-pink-dark underline underline-offset-2 transition hover:text-pink-btn">
                                    {checkoutAddress ? "Change" : "Add"}
                                </Link>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-4 sm:flex-row sm:items-center sm:gap-4">
                                <label htmlFor="checkout-phone" className="flex-none font-mono text-label uppercase tracking-[.14em] text-grey">
                                    Mobile
                                </label>
                                <input
                                    id="checkout-phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    placeholder="0917 123 4567"
                                    value={phoneValue}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    onBlur={() => setPhoneTouched(true)}
                                    aria-invalid={phoneTouched && !phoneNormalized}
                                    aria-describedby="checkout-phone-hint"
                                    className="ui-input h-11 max-w-[220px] py-0"
                                />
                            </div>
                            <p id="checkout-phone-hint" className={`m-0 mt-2 text-label ${phoneTouched && !phoneNormalized ? "text-alert" : "text-grey"}`}>
                                {phoneTouched && !phoneNormalized ? PHONE_ERROR : "The courier calls or texts this number about your delivery."}
                            </p>

                            {estimate && (
                                <p className="m-0 mt-4 border-t border-ink/10 pt-4 text-meta leading-relaxed text-grey">
                                    Ships <span className="text-ink">{estimate.ships}</span> · Arrives <span className="text-ink">{estimate.arrives}</span>
                                    <span className="mt-1 block text-label">{estimate.zone} estimate, counted from when your payment is confirmed.</span>
                                </p>
                            )}
                        </div>
                    </section>
                    </aside>
                </form>

                <ActionBar>
                    <div className="mr-auto min-w-0">
                        <BarTotal amount={quote ? total : null} saved={quote ? saved : 0} shipping={quote ? shippingFee : null} note={quoteFailed ? "We couldn't confirm your price. Try again to place your order." : !configured && (instructionsFailed || instructions) ? "Payment details aren't available yet." : !file ? "Upload your payment screenshot to place your order." : !checkoutAddress ? "Add a delivery address to place your order." : !phoneNormalized ? "Add a mobile number to place your order." : undefined} />
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

// Same headline treatment as the bag, wishlist and shop pages.
function CheckoutTitle() {
    return (
        <header className="mb-8 border-b border-ink/10 pb-8 md:mb-12 md:pb-10">
            <h1 className="mb-0 max-w-none text-[30px] leading-[1.08] font-normal sm:text-[38px] lg:text-[42px]">
                One last step, <br />
                <em className="pink-highlight font-normal">to your door.</em>
            </h1>
        </header>
    );
}

function CheckoutSkeleton() {
    return (
        <div className={SHELL}>
            <SkeletonGroup>
                <div className="mb-6 flex min-h-11 items-center md:mb-8">
                    <Skeleton className="h-[12.5px] w-20" />
                </div>

                <div className="mb-8 border-b border-ink/10 pb-8 md:mb-12 md:pb-10">
                    <Skeleton className="h-[32px] w-56 sm:h-[41px] lg:h-[45px]" />
                    <Skeleton className="mt-2 h-[32px] w-44 sm:h-[41px] lg:h-[45px]" />
                </div>

                <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
                    <div className="flex flex-col gap-10">
                        {[0, 1].map((i) => (
                            <div key={i}>
                                <HeadingBar width="w-24" />
                                <div className="border border-ink/10 bg-white p-4 shadow-[0_2px_4px_rgba(61,90,115,.06),0_12px_28px_-8px_rgba(61,90,115,.18)] sm:p-5">
                                    <Skeleton className="mb-3 h-[14px] w-1/3" />
                                    <Skeleton tone="soft" className="mb-2 h-[13px] w-2/3" />
                                    <Skeleton tone="outline" className="h-[44px] w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="order-first lg:order-last">
                        <HeadingBar width="w-20" />
                        <div className="border border-ink/10 bg-white p-4 shadow-[0_2px_4px_rgba(61,90,115,.06),0_12px_28px_-8px_rgba(61,90,115,.18)] sm:p-5">
                            <Skeleton className="mb-3 h-[14px] w-1/3" />
                            <Skeleton tone="soft" className="mb-2 h-[13px] w-2/3" />
                            <Skeleton tone="outline" className="h-[44px] w-full" />
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
