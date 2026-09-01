"use client";

import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useStore } from "@/library/store";

export default function WelcomePromoModal() {
    const { activeModal, closeModal, openModal, showToast } = useStore();
    const [email, setEmail] = useState("");
    const [claimed, setClaimed] = useState(false);
    const open = activeModal === "welcome";

    useEffect(() => {
        if (sessionStorage.getItem("welcomePromoShown")) return;
        const timer = setTimeout(() => {
            openModal("welcome");
            sessionStorage.setItem("welcomePromoShown", "1");
        }, 1400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        // TODO: send to a real email list (Mailchimp/Klaviyo) and generate a real one-time code.
        setClaimed(true);
        showToast("success", "Code emailed — check your inbox.");
    }

    return (
        <Modal open={open} onClose={closeModal} maxWidth="max-w-[420px]">
            <div className="bg-pastel-diagonal px-8 pt-10 pb-7 text-center">
                <div className="eyebrow mb-3.5 inline-flex items-center gap-2 text-pink-dark">✦ Welcome Offer</div>
                <h3 className="mb-2.5 text-[27px] font-medium text-ink">10% off, on us.</h3>
                <p className="mx-auto max-w-[300px] text-[13px] leading-relaxed text-ink/70">
                    Sign up for first access to new formulas and take 10% off your first order.
                </p>
            </div>
            <div className="px-8 pt-6 pb-8">
                {claimed ? (
                    <p className="text-center text-[13px] text-ink">
                        You&apos;re in! Use code <b>RITUAL10</b> at checkout.
                    </p>
                ) : (
                    <>
                        <form onSubmit={submit}>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email address"
                                className="mb-3 w-full border-b border-ink/25 bg-transparent py-2 text-center text-sm text-ink outline-none transition focus:border-pink-dark"
                            />
                            <button type="submit" className="w-full bg-pink-btn py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-btn-hover">
                                Claim my 10% off
                            </button>
                        </form>
                        <p className="mt-3.5 text-center text-[11px] text-grey">
                            Code <b>RITUAL10</b> will be emailed to you instantly.
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
}
