"use client";

import { useEffect, useRef, useState } from "react";
import Modal, { ModalClose } from "../ui/Modal";
import { ApiError } from "@/library/api/client";
import { submitPaymentProof } from "@/library/api/orders";
import { EMPTY_PAYMENT_INSTRUCTIONS, getPaymentInstructions, PaymentInstructions, PaymentMethodId } from "@/library/api/payments";

const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const input = "ui-input";
const label = "ui-label";

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
    const [amount, setAmount] = useState(String(total));
    const [senderName, setSenderName] = useState("");
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
            await submitPaymentProof(orderNo, { method: activeMethod, reference: reference.trim() || undefined, amount: Number(amount) > 0 ? Math.round(Number(amount)) : undefined, senderName: senderName.trim() || undefined, file });
            showToast("success", "Thanks — we'll check your payment and confirm your order soon.");
            onSubmitted();
            onClose();
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Couldn't upload that. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    const dirty = !!file || reference.trim() !== "" || senderName.trim() !== "";

    return (
        <Modal
            open
            onClose={busy ? () => {} : onClose}
            maxWidth="max-w-[480px]"
            eyebrow={`Order ${orderNo}`}
            heading={`Send ₱${total.toLocaleString()}`}
            dirty={dirty && !busy}
            footer={
                <>
                    <ModalClose asChild>
                        <button type="button" disabled={busy} className="ui-btn ui-btn-secondary">
                            Later
                        </button>
                    </ModalClose>
                    <button type="submit" form="proof-form" disabled={busy || !file} className="ui-btn ui-btn-primary">
                        {busy ? "Uploading…" : "Send for verification"}
                    </button>
                </>
            }
        >
            <form id="proof-form" onSubmit={submit}>
                <p className="mb-5 text-meta leading-relaxed text-grey">{(instructions ?? EMPTY_PAYMENT_INSTRUCTIONS).intro}</p>

                {instructions && !configured && (
                    <p role="status" className="mb-5 border border-pink-dark/30 bg-pink-soft/40 px-3 py-2 text-meta text-ink">
                        Payment details haven&apos;t been set up yet. Please contact us and we&apos;ll tell you where to send your payment.
                    </p>
                )}

                {configured && (
                    <fieldset className="mb-5 flex flex-col gap-2 border-0 p-0">
                        <legend className={label}>Pay with</legend>
                        {methods.map((m) => {
                            const active = m.id === activeMethod;
                            return (
                                <label key={m.id} className={`block cursor-pointer border p-3.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy ${active ? "border-navy" : "border-ink/10 hover:border-ink/30"}`}>
                                    <input type="radio" name="proof-method" value={m.id} checked={active} onChange={() => setMethod(m.id)} className="sr-only" />
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-small font-medium text-ink">{m.label}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText(m.accountNumber).then(() => showToast("success", "Number copied."));
                                            }}
                                            className="inline-flex min-h-11 items-center px-1 text-label text-pink-dark underline underline-offset-2"
                                        >
                                            Copy number
                                        </button>
                                    </div>
                                    <div className="font-mono text-small text-ink">{m.accountNumber}</div>
                                    {m.accountName && <div className="text-meta text-grey">{m.accountName}</div>}
                                    {m.notes && <div className="mt-1 text-label text-grey">{m.notes}</div>}
                                </label>
                            );
                        })}
                    </fieldset>
                )}

                <label className={label}>
                    Screenshot of your receipt <span className="normal-case tracking-normal text-pink-dark">· required</span>
                </label>
                <input ref={picker} type="file" accept={ACCEPTED.join(",")} onChange={pick} className="hidden" />
                <button
                    type="button"
                    onClick={() => picker.current?.click()}
                    className="mb-5 flex w-full items-center gap-4 border border-dashed border-ink/25 p-3 text-left transition hover:border-navy focus-visible:ring-2 focus-visible:ring-navy"
                >
                    {file && preview ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Your screenshot" className="h-16 w-16 flex-none object-cover" />
                            <span className="min-w-0 text-meta text-ink">
                                <span className="block truncate">{file.name}</span>
                                <span className="text-grey">Tap to choose a different one</span>
                            </span>
                        </>
                    ) : (
                        <span className="text-meta text-grey">Choose a JPG, PNG or WEBP image (max 3MB)</span>
                    )}
                </button>

                <div className="mb-4 font-mono text-label uppercase tracking-[.16em] text-grey">Optional details</div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="proof-ref" className={label}>Reference no.</label>
                        <input id="proof-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} className={input} />
                    </div>
                    <div>
                        <label htmlFor="proof-sender" className={label}>Sender name</label>
                        <input id="proof-sender" value={senderName} onChange={(e) => setSenderName(e.target.value)} maxLength={100} className={input} />
                    </div>
                    <div>
                        <label htmlFor="proof-amount" className={label}>Amount sent (₱)</label>
                        <input id="proof-amount" type="number" inputMode="numeric" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
                    </div>
                </div>
            </form>
        </Modal>
    );
}
