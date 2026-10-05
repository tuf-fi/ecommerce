"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "../ui/Modal";
import { ApiError } from "@/library/api/client";
import { submitPaymentProof } from "@/library/api/orders";
import { EMPTY_PAYMENT_INSTRUCTIONS, getPaymentInstructions, PaymentInstructions, PaymentMethodId } from "@/library/api/payments";

const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const input = "w-full border border-ink/15 bg-white p-3 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1";
const label = "mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey";

// Mounted only while open, so the form starts fresh every time. Shows where to send the money, then takes the screenshot.
export default function PaymentProofModal({
    orderNo,
    total,
    onClose,
    onSubmitted,
    showToast,
}: {
    orderNo: string;
    total: number;
    onClose: () => void;
    onSubmitted: () => void;
    showToast: (type: "success" | "error", message: string) => void;
}) {
    const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
    const [method, setMethod] = useState<PaymentMethodId>("gcash");
    const [reference, setReference] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const picker = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let alive = true;
        getPaymentInstructions().then((i) => alive && setInstructions(i));
        return () => {
            alive = false;
        };
    }, []);

    // Release the preview's in-memory URL when it changes or the dialog closes.
    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from an external resource (the object URL)
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

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

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return showToast("error", "Attach your payment screenshot first.");
        setBusy(true);
        try {
            await submitPaymentProof(orderNo, { method: activeMethod, reference: reference.trim() || undefined, file });
            showToast("success", "Thanks — we'll check your payment and confirm your order soon.");
            onSubmitted();
            onClose();
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Couldn't upload that. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal open onClose={busy ? () => {} : onClose} maxWidth="max-w-[480px]" title={`Pay for order ${orderNo}`}>
            <form onSubmit={submit} className="p-8">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-grey">Order {orderNo}</div>
                <h3 className="mb-1 text-xl font-medium text-ink">Send ₱{total.toLocaleString()}</h3>
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
                        <label htmlFor="proof-method" className={label}>I paid with</label>
                        <select id="proof-method" value={activeMethod} onChange={(e) => setMethod(e.target.value as PaymentMethodId)} className={input}>
                            {(configured ? methods : EMPTY_PAYMENT_INSTRUCTIONS.methods).map((m) => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="proof-ref" className={label}>Reference no.</label>
                        <input id="proof-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} placeholder="Optional" className={input} />
                    </div>
                </div>

                <label className={label}>Screenshot of your receipt</label>
                <input ref={picker} type="file" accept={ACCEPTED.join(",")} onChange={pick} className="hidden" />
                <button
                    type="button"
                    onClick={() => picker.current?.click()}
                    className="mb-5 flex w-full items-center gap-4 border border-dashed border-ink/25 p-3 text-left transition hover:border-pink-dark"
                >
                    {file && preview ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Your screenshot" className="h-16 w-16 flex-none object-cover" />
                            <span className="min-w-0 text-[12.5px] text-ink">
                                <span className="block truncate">{file.name}</span>
                                <span className="text-grey">Tap to choose a different one</span>
                            </span>
                        </>
                    ) : (
                        <span className="text-[12.5px] text-grey">Choose a JPG, PNG or WEBP image (max 3MB)</span>
                    )}
                </button>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={busy || !file}
                        className="flex-1 bg-navy py-3 text-[13px] font-semibold text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy"
                    >
                        {busy ? "Uploading…" : "Send for verification"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="border border-ink/15 px-4 text-[13px] text-ink transition hover:bg-off disabled:opacity-60"
                    >
                        Later
                    </button>
                </div>
            </form>
        </Modal>
    );
}
