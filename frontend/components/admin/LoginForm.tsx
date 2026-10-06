"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAdminStore } from "@/library/adminStore";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL, FULL_BLEED } from "@/components/admin/formClasses";
import { useAsyncAction } from "@/library/useAsyncAction";
import { EASE } from "@/components/ui/motion/constants";

export default function LoginForm() {
    const { isAdminLoggedIn, authChecked, login, completeTwoFactor } = useAdminStore();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    // Set once the password step succeeds for an account with 2FA; the form then asks for a code instead.
    const [challenge, setChallenge] = useState<string | null>(null);
    const [code, setCode] = useState("");

    useEffect(() => {
        if (authChecked && isAdminLoggedIn) router.replace("/admin/dashboard");
    }, [authChecked, isAdminLoggedIn, router]);

    const [submitting, handleSubmit] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (challenge) {
            if (!code.trim()) {
                setError("Enter the code from your authenticator app.");
                return;
            }
            const failure = await completeTwoFactor(challenge, code.trim());
            if (failure) {
                setError(failure);
                return;
            }
            router.push("/admin/dashboard");
            return;
        }
        if (!email.trim() || !password.trim()) {
            setError("Enter both an email and password.");
            return;
        }
        const outcome = await login(email, password);
        if (outcome.status === "error") {
            setError(outcome.message);
            return;
        }
        if (outcome.status === "twoFactor") {
            setChallenge(outcome.challenge);
            return;
        }
        router.push("/admin/dashboard");
    });

    return (
        // Form leads (DOM and visual order) with the brand panel trailing as supporting context, not the reverse.
        <div className={`${FULL_BLEED} flex min-h-screen`}>
            {/* Sign-in form */}
            <div className="flex flex-1 items-center justify-center bg-white px-6 py-16">
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="w-full max-w-[360px]"
                >
                    <div className="mb-10 lg:hidden">
                        <div className="mb-1 font-display text-[21px] font-medium text-ink">Cindyrella</div>
                        <div className="font-mono text-[10.5px] tracking-[.14em] text-grey uppercase">Admin Panel</div>
                    </div>

                    <div className="mb-1.5 font-mono text-[10.5px] tracking-[.16em] text-grey uppercase">Sign In</div>
                    <h2 className="mb-8 font-display text-[26px] font-normal text-ink">{challenge ? "Verify it's you." : "Welcome back."}</h2>

                    {!challenge && (
                    <>

                    <div className="mb-4">
                        <label htmlFor="admin-login-email" className={FIELD_LABEL}>Email</label>
                        <input
                            id="admin-login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@cindyrella.ph"
                            autoComplete="email"
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div className="mb-5">
                        <label htmlFor="admin-login-password" className={FIELD_LABEL}>Password</label>
                        <input
                            id="admin-login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={FIELD_INPUT}
                        />
                    </div>
                    </>
                    )}

                    {challenge && (
                        <div className="mb-5">
                            <label htmlFor="admin-login-code" className={FIELD_LABEL}>Authentication code</label>
                            <input
                                id="admin-login-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="6-digit code or recovery code"
                                autoComplete="one-time-code"
                                inputMode="text"
                                autoFocus
                                className={FIELD_INPUT}
                            />
                            <p className="mt-2 text-[11.5px] text-grey">Open your authenticator app, or use one of your saved recovery codes.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setChallenge(null);
                                    setCode("");
                                    setError("");
                                }}
                                className="mt-2 text-[11.5px] text-grey underline underline-offset-2 hover:text-ink"
                            >
                                Back to sign in
                            </button>
                        </div>
                    )}

                    {error && (
                        <p className="mb-4 border-l-2 border-alert bg-alert/5 px-3 py-2 text-[12px] text-alert">{error}</p>
                    )}

                    <button type="submit" disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                        {submitting ? (challenge ? "Verifying…" : "Signing In…") : challenge ? "Verify" : "Sign In"}
                    </button>

                </motion.form>
            </div>

            {/* Brand panel — hidden below lg, where the form carries the whole screen */}
            <div className="relative hidden w-[42%] flex-none flex-col justify-between bg-navy px-16 py-14 text-white lg:flex">
                <div className="font-display text-[20px] font-medium tracking-wide">Cindyrella</div>

                <div className="max-w-[380px]">
                    <div className="mb-6 flex items-center gap-x-4 uppercase">
                        <span className="font-mono text-[10.5px] text-grey-light">01</span>
                        <span className="font-mono text-[10.5px] tracking-[.16em] text-white/70">Admin Access</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
                    </div>
                    <h1 className="mb-4 font-display text-[36px] leading-[1.05] font-normal text-white">
                        Run the shop floor from here.
                    </h1>
                    <p className="text-[13px] leading-relaxed text-grey-light">
                        Inventory, orders, staff, and content — one panel for everyone who keeps Cindyrella running.
                    </p>
                </div>

                <div className="font-mono text-[10px] tracking-[.14em] text-white/35 uppercase">Restricted — Staff Only</div>
            </div>
        </div>
    );
}
