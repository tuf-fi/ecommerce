"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/library/api/client";
import { requestWelcomeCode } from "@/library/api/marketing";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Modal, { ModalTitle } from "../ui/Modal";
import { useStore } from "@/library/store";
import { philosophyImage } from "../ui/images";
import { useAsyncAction } from "@/library/useAsyncAction";

export default function WelcomePromoModal() {
    const { activeModal, closeModal, openModal, showToast, isLoggedIn } = useStore();
    const pathname = usePathname();
    const [email, setEmail] = useState("");
    const [claimed, setClaimed] = useState(false);
    const [error, setError] = useState("");
    const open = activeModal === "welcome";

    // Only anonymous visitors browsing the storefront; never mid-purchase. A dismissal is remembered for 30 days.
    const eligible = !isLoggedIn && (pathname === "/" || pathname.startsWith("/journal"));

    useEffect(() => {
        if (!eligible) return;
        try {
            const until = Number(localStorage.getItem("welcomePromoUntil") ?? 0);
            if (until > Date.now() || sessionStorage.getItem("welcomePromoShown")) return;
        } catch {
            return;
        }

        // Gated on scroll depth, not a flat timer, so it doesn't interrupt a visitor before they've read the Hero headline.
        function handleScroll() {
            // About halfway down the page, after the visitor has seen some of what is for sale.
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollable <= 0 || window.scrollY < scrollable * 0.5) return;
            openModal("welcome");
            try {
                sessionStorage.setItem("welcomePromoShown", "1");
            } catch {}
            window.removeEventListener("scroll", handleScroll);
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eligible]);

    function dismiss() {
        try {
            localStorage.setItem("welcomePromoUntil", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        } catch {}
        closeModal();
    }

    const [submitting, submit] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await requestWelcomeCode(email);
            setClaimed(true);
            try {
                localStorage.setItem("welcomePromoUntil", String(Date.now() + 365 * 24 * 60 * 60 * 1000));
            } catch {}
            showToast("success", "Code emailed — check your inbox.");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't send your code. Please try again.");
        }
    });

    return (
        <Modal open={open} onClose={dismiss} maxWidth="max-w-[600px]" titleInBody dirty={email.trim() !== "" && !claimed && !submitting} onOpenAutoFocus={(e) => {
            // A scroll-triggered popup shouldn't grab a control (or raise the phone keyboard): focus the dialog itself.
            e.preventDefault();
            (e.target as HTMLElement).focus();
        }}>
            <div className="grid grid-cols-1 items-stretch sm:grid-cols-[38%_62%]">
                <div className="relative hidden overflow-hidden sm:block">
                    <Image src={philosophyImage} alt="" fill sizes="(min-width: 640px) 230px, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-col justify-center gap-4 px-6 py-7 sm:px-8 sm:py-9">
                    <div>
                        <ModalTitle asChild>
                            <h3 className="mb-2.5 text-heading leading-[1.05] font-medium text-ink">10% off, on us.</h3>
                        </ModalTitle>
                        <p className="text-small leading-relaxed text-grey">
                            Sign up for first access to new formulas, and we will email you a one-time code for 10% off your first order.
                        </p>
                    </div>
                    {claimed ? (
                        <p className="text-small text-ink">
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
                                    aria-invalid={!!error}
                                    aria-describedby={error ? "welcome-promo-error" : undefined}
                                    className={`ui-input ${error ? "ui-input-invalid" : ""}`}
                                />
                                {error && <p id="welcome-promo-error" role="alert" className="ui-error m-0">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="ui-btn ui-btn-primary w-full"
                                >
                                    {submitting ? "Claiming…" : "Claim my 10% off"}
                                </button>
                            </form>
                            <p className="mt-3 text-label text-grey">
                                Your one-time code will be emailed to you.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
