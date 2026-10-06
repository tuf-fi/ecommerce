"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/library/api/client";
import { requestWelcomeCode } from "@/library/api/marketing";
import Image from "next/image";
import Modal from "../ui/Modal";
import { useStore } from "@/library/store";
import { philosophyImage } from "../ui/images";
import { useAsyncAction } from "@/library/useAsyncAction";

export default function WelcomePromoModal() {
    const { activeModal, closeModal, openModal, showToast } = useStore();
    const [email, setEmail] = useState("");
    const [claimed, setClaimed] = useState(false);
    const open = activeModal === "welcome";

    useEffect(() => {
        if (sessionStorage.getItem("welcomePromoShown")) return;

        // Gated on scroll depth, not a flat timer, so it doesn't interrupt a visitor before they've read the Hero headline.
        function handleScroll() {
            if (window.scrollY < window.innerHeight * 0.9) return;
            openModal("welcome");
            sessionStorage.setItem("welcomePromoShown", "1");
            window.removeEventListener("scroll", handleScroll);
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [submitting, submit] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await requestWelcomeCode(email);
            setClaimed(true);
            showToast("success", "Code emailed — check your inbox.");
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Couldn't send your code. Please try again.");
        }
    });

    return (
        <Modal open={open} onClose={closeModal} maxWidth="max-w-[600px]">
            <div className="grid grid-cols-[38%_62%] items-stretch">
                <div className="relative overflow-hidden">
                    <Image src={philosophyImage} alt="" fill sizes="230px" className="object-cover" />
                </div>
                <div className="flex flex-col justify-center gap-4 px-8 py-9">
                    <div>
                        <div className="eyebrow mb-3 inline-flex items-center gap-2 text-pink-dark">✦ Welcome Offer</div>
                        <h3 className="mb-2.5 text-[26px] leading-[1.05] font-medium text-ink">10% off, on us.</h3>
                        <p className="text-[13px] leading-relaxed text-grey">
                            Sign up for first access to new formulas and take 10% off your first order.
                        </p>
                    </div>
                    {claimed ? (
                        <p className="text-[13px] text-ink">
                            You&apos;re in! Your code is on its way to your inbox.
                        </p>
                    ) : (
                        <div>
                            <form onSubmit={submit} className="flex flex-col gap-2.5">
                                <label htmlFor="welcome-promo-email" className="sr-only">
                                    Email address
                                </label>
                                <input
                                    id="welcome-promo-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email address"
                                    className="w-full border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-pink-btn py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-btn-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-pink-btn"
                                >
                                    {submitting ? "Claiming…" : "Claim my 10% off"}
                                </button>
                            </form>
                            <p className="mt-3 text-[11px] text-grey">
                                Your one-time code will be emailed to you.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
