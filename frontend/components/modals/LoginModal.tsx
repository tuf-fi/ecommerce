"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "../ui/Modal";
import { EASE } from "../ui/motion/constants";
import { useStore } from "@/library/store";
import { contactImage, newsletterImage } from "@/components/ui/images";
import { useAsyncAction } from "@/library/useAsyncAction";
import { ApiError } from "@/library/api/client";
import { customerLogin, customerRegister, otpRequest, otpVerify } from "@/library/api/auth";
import { customerGoogleSignIn } from "@/library/api/customer";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type GoogleId = {
    initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
    prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
};
const googleId = () => (window as unknown as { google?: { accounts?: { id?: GoogleId } } }).google?.accounts?.id;

// Google's sign-in script is only fetched when someone actually presses the button.
function loadGoogleScript(): Promise<void> {
    if (googleId()) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("load"));
        document.head.appendChild(s);
    });
}

type Mode = "login" | "signup" | "forgot";

export default function LoginModal() {
    const { activeModal, closeModal } = useStore();
    const open = activeModal === "login";

    return (
        <Modal open={open} onClose={closeModal} maxWidth="max-w-[760px]" hideDefaultClose>
            {open && <LoginContent onClose={closeModal} />}
        </Modal>
    );
}

function LoginContent({ onClose }: { onClose: () => void }) {
    const { signIn, showToast } = useStore();
    const [mode, setMode] = useState<Mode>("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [submitting, submit] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { customer } =
                mode === "signup" ? await customerRegister({ name, email, password }) : await customerLogin({ email, password });
            signIn(customer);
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        }
    });

    const [googleSubmitting, signUpWithGoogle] = useAsyncAction(async () => {
        if (!GOOGLE_CLIENT_ID) {
            showToast("error", "Google sign-in isn't available yet.");
            return;
        }
        try {
            await loadGoogleScript();
            const g = googleId();
            if (!g) throw new Error("load");
            // Google hands back a signed ID token; the server checks it with Google and starts the session.
            g.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: ({ credential }) => {
                    customerGoogleSignIn(credential)
                        .then(({ customer }) => signIn(customer))
                        .catch((err) => showToast("error", err instanceof ApiError ? err.message : "Google sign-in failed. Please try again."));
                },
            });
            g.prompt((n) => {
                if (n.isNotDisplayed() || n.isSkippedMoment()) showToast("error", "Google sign-in was closed or blocked. Allow pop-ups and try again.");
            });
        } catch {
            showToast("error", "Couldn't reach Google. Please try again.");
        }
    });

    const imagePanel = (
        <div className="relative hidden h-full min-h-[320px] overflow-hidden sm:block">
            <Image
                src={mode === "signup" ? newsletterImage : contactImage}
                alt=""
                fill
                sizes="380px"
                className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
                <h4 className="text-lg font-medium text-white">Cindyrella</h4>
                <p className="text-[12.5px] text-white/75">
                    {mode === "signup" ? "Join the ritual, from day one." : "Welcome back to the ritual."}
                </p>
            </div>
        </div>
    );

    const loginOrSignupForm = (
        <div className="p-6 sm:p-10">
            <h3 className="mb-1 text-xl font-medium text-ink">
                {mode === "login" ? "Welcome back" : "Create an account"}
            </h3>
            <p className="mb-6 text-[12px] text-grey">
                {mode === "login" ? "Sign in to your account." : "Use at least 8 characters for your password."}
            </p>

            <form onSubmit={submit}>
                {mode === "signup" && (
                    <div className="mb-4">
                        <label htmlFor="login-name" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Full Name</label>
                        <input
                            id="login-name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="w-full border-b border-ink/25 bg-transparent py-2 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                        />
                    </div>
                )}

                <div className="mb-4">
                    <label htmlFor="login-email" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full border-b border-ink/25 bg-transparent py-2 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                    />
                </div>

                <div className="mb-5">
                    <label htmlFor="login-password" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border-b border-ink/25 bg-transparent py-2 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                    />
                </div>

                {mode === "login" && (
                    <div className="mb-6 flex items-center justify-between text-[12px]">
                        <label className="flex items-center gap-1.5 text-grey">
                            <input type="checkbox" className="accent-pink-btn" />
                            Remember me
                        </label>
                        <button type="button" onClick={() => setMode("forgot")} className="text-pink-dark underline underline-offset-2">
                            Forgot password?
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy"
                >
                    {submitting ? (mode === "login" ? "Signing In…" : "Signing Up…") : mode === "login" ? "Sign In" : "Sign Up"}
                </button>
            </form>

            {mode === "signup" && (
                <>
                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-ink/10" />
                        <span className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">or continue with</span>
                        <div className="h-px flex-1 bg-ink/10" />
                    </div>

                    <button
                        type="button"
                        onClick={signUpWithGoogle}
                        disabled={googleSubmitting}
                        className="flex w-full items-center justify-center gap-2.5 border border-ink/15 py-3.5 text-[13px] font-semibold text-ink transition hover:bg-off disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                    >
                        {!googleSubmitting && (
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M23.49 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v2.99h3.87c2.27-2.09 3.55-5.17 3.55-8.81z" />
                                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.92l-3.87-2.99c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A11.998 11.998 0 0 0 12 24z" />
                                <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.09z" />
                                <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.09C6.22 6.87 8.87 4.77 12 4.77z" />
                            </svg>
                        )}
                        {googleSubmitting ? "Signing Up…" : "Sign up with Google"}
                    </button>
                </>
            )}

            <p className="mt-5 text-center text-[12.5px] text-grey">
                {mode === "login" ? (
                    <>
                        Don&apos;t have an account?{" "}
                        <button onClick={() => setMode("signup")} className="text-pink-dark underline underline-offset-2">
                            Sign Up
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <button onClick={() => setMode("login")} className="text-pink-dark underline underline-offset-2">
                            Sign In
                        </button>
                    </>
                )}
            </p>
        </div>
    );

    return (
        <motion.div layout transition={{ duration: 0.3, ease: EASE }} className="grid items-stretch sm:grid-cols-2">
            <motion.div layout transition={{ duration: 0.4, ease: EASE }} className={mode === "signup" ? "sm:order-2" : "sm:order-1"}>
                {imagePanel}
            </motion.div>
            <motion.div
                layout
                transition={{ duration: 0.4, ease: EASE }}
                className={`relative overflow-hidden bg-white ${mode === "signup" ? "sm:order-1" : "sm:order-2"}`}
            >
                <button
                    aria-label="Close"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center text-lg text-ink/50 transition hover:text-ink"
                >
                    ×
                </button>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: EASE }}
                    >
                        {mode === "forgot" ? <ForgotPasswordForm onBack={() => setMode("login")} showToast={showToast} /> : loginOrSignupForm}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

function ForgotPasswordForm({
    onBack,
    showToast,
}: {
    onBack: () => void;
    showToast: (type: "success" | "error", message: string) => void;
}) {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [code, setCode] = useState<string[]>(Array(6).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const codeComplete = code.every((c) => c !== "") && newPassword.length >= 8;

    const [sending, sendCode] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await otpRequest(email);
            setSent(true);
            showToast("success", `If an account exists for ${email}, a code is on its way.`);
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        }
    });

    const [resending, resendCode] = useAsyncAction(async () => {
        try {
            await otpRequest(email);
            showToast("success", "A new code is on its way.");
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        }
    });

    const [verifying, verifyCode] = useAsyncAction(async () => {
        try {
            await otpVerify({ email, code: code.join(""), newPassword });
            showToast("success", "Password updated — you can now sign in.");
            onBack();
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        }
    });

    function updateDigit(index: number, value: string) {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...code];
        next[index] = digit;
        setCode(next);
        if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    return (
        <div className="p-6 sm:p-10">
            <h3 className="mb-1 text-xl font-medium text-ink">Reset your password</h3>
            <p className="mb-6 text-[12px] text-grey">
                {sent ? `Enter the 6-digit code we sent to ${email}.` : "Enter your email and we'll send you a verification code."}
            </p>

            {!sent ? (
                <form onSubmit={sendCode}>
                    <div className="mb-6">
                        <label htmlFor="forgot-password-email" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Email</label>
                        <input
                            id="forgot-password-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            className="w-full border-b border-ink/25 bg-transparent py-2 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sending}
                        className="w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy"
                    >
                        {sending ? "Sending…" : "Send Code"}
                    </button>
                </form>
            ) : (
                <div>
                    <div className="mb-6 flex justify-between gap-2">
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                value={digit}
                                onChange={(e) => updateDigit(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                inputMode="numeric"
                                maxLength={1}
                                aria-label={`Digit ${i + 1} of ${code.length}`}
                                className="h-14 w-12 border border-ink/20 text-center text-lg text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                            />
                        ))}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="forgot-password-new" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">New Password</label>
                        <input
                            id="forgot-password-new"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            className="w-full border-b border-ink/25 bg-transparent py-2 text-sm text-ink outline-none transition focus:border-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                        />
                    </div>

                    <button
                        onClick={verifyCode}
                        disabled={!codeComplete || verifying}
                        className="w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:bg-ink/20 disabled:hover:bg-ink/20"
                    >
                        {verifying ? "Updating…" : "Reset Password"}
                    </button>

                    <button
                        onClick={resendCode}
                        disabled={resending}
                        className="mt-4 w-full text-center text-[12.5px] text-pink-dark underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {resending ? "Resending…" : "Resend Code"}
                    </button>
                </div>
            )}

            <button onClick={onBack} className="mt-5 block w-full text-center text-[12.5px] text-grey underline underline-offset-2">
                Back to Sign In
            </button>
        </div>
    );
}
