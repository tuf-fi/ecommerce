"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Modal from "../ui/Modal";
import Checkbox from "../ui/Checkbox";
import GoogleButton from "../auth/GoogleButton";
import { useStore } from "@/library/store";
import { useAsyncAction } from "@/library/useAsyncAction";
import { ApiError } from "@/library/api/client";
import { customerLogin, customerRegister, otpRequest, otpVerify } from "@/library/api/auth";

type Mode = "login" | "signup" | "forgot";

const HEADINGS: Record<Mode, string> = {
    login: "Welcome back",
    signup: "Create an account",
    forgot: "Reset your password",
};
// First field of each mode, focused on open and after switching so keyboard users never land on a removed control.
const FIRST_FIELD: Record<Mode, string> = { login: "login-email", signup: "signup-name", forgot: "forgot-email" };
const EYEBROWS: Record<Mode, string> = { login: "Sign in", signup: "Join", forgot: "Password" };

const apiMessage = (err: unknown) => (err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");

// What a mode reports upward: `any` = something typed (guards closing), `heavy` = more than the email (guards switching modes).
type Dirty = { any: boolean; heavy: boolean };
const CLEAN: Dirty = { any: false, heavy: false };

// Sign-in, sign-up and password reset share one modal so a shopper never loses their place on the page behind it.
export default function LoginModal() {
    const { activeModal, closeModal } = useStore();
    const open = activeModal === "login";
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [dirty, setDirty] = useState<Dirty>(CLEAN);
    const [pendingMode, setPendingMode] = useState<Mode | null>(null);
    // The control that asked to switch, so "Keep editing" can hand focus back to it.
    const switchTrigger = useRef<HTMLElement | null>(null);

    // Render-time reset on open (AnimatePresence keeps this mounted through the close animation).
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setMode("login");
            setEmail("");
            setDirty(CLEAN);
            setPendingMode(null);
        }
    }

    function switchMode(next: Mode, force = false) {
        if (dirty.heavy && !force) {
            switchTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            setPendingMode(next);
            return;
        }
        setDirty(CLEAN);
        setMode(next);
        requestAnimationFrame(() => document.getElementById(FIRST_FIELD[next])?.focus());
    }

    function confirmSwitch() {
        if (!pendingMode) return;
        setDirty(CLEAN);
        const next = pendingMode;
        setMode(next);
        setPendingMode(null);
        requestAnimationFrame(() => document.getElementById(FIRST_FIELD[next])?.focus());
    }

    const shared = { email, setEmail, onSwitch: switchMode, onDirty: setDirty };

    return (
        <Modal
            open={open}
            onClose={closeModal}
            maxWidth="max-w-[440px]"
            eyebrow={EYEBROWS[mode]}
            heading={HEADINGS[mode]}
            dirty={dirty.any}
            onOpenAutoFocus={(e) => {
                // User-initiated, so start in the first field rather than on Close.
                e.preventDefault();
                document.getElementById(FIRST_FIELD.login)?.focus();
            }}
        >
            {open && (
                <>
                    {pendingMode && (
                        <div role="alert" className="mb-5 border border-ink/15 bg-off/60 p-4">
                            <p className="m-0 mb-3 text-small text-ink">Discard what you&apos;ve entered and switch?</p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    autoFocus
                                    onClick={() => {
                                        setPendingMode(null);
                                        requestAnimationFrame(() => switchTrigger.current?.focus());
                                    }}
                                    className="ui-btn ui-btn-secondary ui-btn-sm"
                                >
                                    Keep editing
                                </button>
                                <button type="button" onClick={confirmSwitch} className="ui-btn ui-btn-destructive ui-btn-sm">
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}
                    {mode === "login" && <LoginForm {...shared} />}
                    {mode === "signup" && <SignupForm {...shared} />}
                    {mode === "forgot" && <ForgotForm {...shared} />}
                </>
            )}
        </Modal>
    );
}

type ModeProps = { email: string; setEmail: (v: string) => void; onSwitch: (m: Mode, force?: boolean) => void; onDirty: (d: Dirty) => void };

function Divider() {
    return (
        <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="font-mono text-label uppercase tracking-[.14em] text-grey">or</span>
            <div className="h-px flex-1 bg-ink/10" />
        </div>
    );
}

function SwitchLine({ children }: { children: React.ReactNode }) {
    return <p className="mt-5 text-center text-meta text-grey">{children}</p>;
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center text-pink-dark underline underline-offset-2">
            {children}
        </button>
    );
}

function FieldError({ id, message }: { id: string; message: string }) {
    return message ? (
        <p id={id} role="alert" className="ui-error">
            {message}
        </p>
    ) : null;
}

// Password field with a show/hide toggle; the toggle is a real button so it stays reachable by keyboard.
function PasswordField({
    id,
    value,
    onChange,
    autoComplete,
    placeholder,
    invalid,
    describedBy,
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete: string;
    placeholder?: string;
    invalid?: boolean;
    describedBy?: string;
}) {
    const [shown, setShown] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={shown ? "text" : "password"}
                required
                autoComplete={autoComplete}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className={`ui-input pr-16 ${invalid ? "ui-input-invalid" : ""}`}
            />
            <button
                type="button"
                onClick={() => setShown((s) => !s)}
                aria-label={shown ? "Hide password" : "Show password"}
                className="absolute top-0 right-0 flex h-full min-w-14 items-center justify-center px-3 font-mono text-label uppercase tracking-[.1em] text-grey transition hover:text-ink focus-visible:ring-2 focus-visible:ring-navy"
            >
                {shown ? "Hide" : "Show"}
            </button>
        </div>
    );
}

function LoginForm({ email, setEmail, onSwitch, onDirty }: ModeProps) {
    const { signIn } = useStore();
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");

    const [submitting, submit] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const { customer } = await customerLogin({ email, password, remember });
            signIn(customer);
        } catch (err) {
            setError(apiMessage(err));
        }
    });

    return (
        <>
            <form onSubmit={submit}>
                <div className="mb-4">
                    <label htmlFor="login-email" className="ui-label">Email</label>
                    <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="ui-input" />
                </div>

                <div className="mb-2">
                    <div className="flex items-baseline justify-between gap-4">
                        <label htmlFor="login-password" className="ui-label">Password</label>
                        <button type="button" onClick={() => onSwitch("forgot")} className="-my-3.5 inline-flex items-center py-3.5 text-meta text-pink-dark underline underline-offset-2">
                            Forgot password?
                        </button>
                    </div>
                    <PasswordField id="login-password" value={password} onChange={(v) => {
                        setPassword(v);
                        // Closing with a typed password asks first; switching modes doesn't, since the password isn't reused there.
                        onDirty({ any: !!v, heavy: false });
                    }} autoComplete="current-password" invalid={!!error} describedBy={error ? "login-error" : undefined} />
                    <FieldError id="login-error" message={error} />
                </div>

                <div className="mb-4">
                    <Checkbox checked={remember} onChange={setRemember} className="text-meta text-grey" label="Keep me signed in for 30 days" />
                </div>

                <button type="submit" disabled={submitting} className="ui-btn ui-btn-primary w-full">
                    {submitting ? "Signing in…" : "Sign in"}
                </button>
            </form>

            <SwitchLine>
                New here? <LinkButton onClick={() => onSwitch("signup")}>Create an account</LinkButton>
            </SwitchLine>

            <Divider />
            <GoogleButton label="Sign in with Google" />
        </>
    );
}

function SignupForm({ email, setEmail, onSwitch, onDirty }: ModeProps) {
    const { signIn } = useStore();
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function report(n: string, e: string, p: string) {
        onDirty({ any: !!(n.trim() || e.trim() || p), heavy: !!(n.trim() || p) });
    }

    const [submitting, submit] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 8) {
            setError("Use at least 8 characters for your password.");
            return;
        }
        try {
            const { customer } = await customerRegister({ name, email, password });
            signIn(customer);
        } catch (err) {
            setError(apiMessage(err));
        }
    });

    return (
        <>
            <form onSubmit={submit}>
                <div className="mb-4">
                    <label htmlFor="signup-name" className="ui-label">Full name</label>
                    <input
                        id="signup-name"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            report(e.target.value, email, password);
                        }}
                        className="ui-input"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="signup-email" className="ui-label">Email</label>
                    <input
                        id="signup-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            report(name, e.target.value, password);
                        }}
                        placeholder="you@email.com"
                        className="ui-input"
                    />
                </div>
                <div className="mb-5">
                    <label htmlFor="signup-password" className="ui-label">Password</label>
                    <PasswordField
                        id="signup-password"
                        value={password}
                        onChange={(v) => {
                            setPassword(v);
                            report(name, email, v);
                        }}
                        autoComplete="new-password"
                        invalid={!!error}
                        describedBy={error ? "signup-error" : "signup-hint"}
                    />
                    <FieldError id="signup-error" message={error} />
                    {!error && <p id="signup-hint" className="m-0 mt-1.5 text-meta text-grey">At least 8 characters.</p>}
                </div>
                <button type="submit" disabled={submitting} className="ui-btn ui-btn-primary w-full">
                    {submitting ? "Creating account…" : "Create account"}
                </button>
                <p className="mt-3 text-label leading-relaxed text-grey">
                    By creating an account you agree to our{" "}
                    <Link href="/pages/terms" className="underline underline-offset-2">Terms</Link> and{" "}
                    <Link href="/pages/privacy-policy" className="underline underline-offset-2">Privacy Policy</Link>.
                </p>
            </form>

            <SwitchLine>
                Already have an account? <LinkButton onClick={() => onSwitch("login")}>Sign in</LinkButton>
            </SwitchLine>

            <Divider />
            <GoogleButton label="Sign up with Google" />
        </>
    );
}

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

function ForgotForm({ email, setEmail, onSwitch, onDirty }: ModeProps) {
    const { showToast } = useStore();
    const [sent, setSent] = useState(false);
    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const [codeError, setCodeError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const ready = code.every((c) => c !== "") && newPassword.length > 0;

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const [sending, sendCode] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError("");
        try {
            await otpRequest(email);
            setSent(true);
            setCooldown(RESEND_SECONDS);
            onDirty({ any: true, heavy: true });
        } catch (err) {
            setEmailError(apiMessage(err));
        }
    });

    const [resending, resendCode] = useAsyncAction(async () => {
        setCodeError("");
        try {
            await otpRequest(email);
            setCooldown(RESEND_SECONDS);
            showToast("success", "A new code is on its way.");
        } catch (err) {
            setCodeError(apiMessage(err));
        }
    });

    const [verifying, verify] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        setCodeError("");
        setPasswordError("");
        if (newPassword.length < 8) {
            setPasswordError("Use at least 8 characters for your new password.");
            return;
        }
        try {
            await otpVerify({ email, code: code.join(""), newPassword });
            showToast("success", "Password updated. You can sign in now.");
            onSwitch("login", true);
        } catch (err) {
            // The server only rejects a wrong or expired code here; length is checked above.
            setCodeError(apiMessage(err));
        }
    });

    function updateDigit(index: number, value: string) {
        const digits = value.replace(/\D/g, "");
        if (!digits) {
            setCode((c) => c.map((d, i) => (i === index ? "" : d)));
            return;
        }
        // One digit fills one box; a pasted code fills the rest in order.
        const next = [...code];
        digits.slice(0, CODE_LENGTH - index).split("").forEach((d, i) => (next[index + i] = d));
        setCode(next);
        inputRefs.current[Math.min(index + digits.length, CODE_LENGTH - 1)]?.focus();
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace" && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
    }

    return (
        <>
            <p className="mb-5 text-meta leading-relaxed text-grey">
                {sent
                    ? `We sent a 6-digit code to ${email}. It expires in 10 minutes. Check your spam folder if it doesn't show up.`
                    : "Enter your email and we'll send you a verification code."}
                {sent && (
                    <>
                        {" "}
                        <button
                            type="button"
                            onClick={() => {
                                setSent(false);
                                setCode(Array(CODE_LENGTH).fill(""));
                                setNewPassword("");
                                setCodeError("");
                                setPasswordError("");
                                setCooldown(0);
                                onDirty({ any: false, heavy: false });
                            }}
                            className="text-pink-dark underline underline-offset-2"
                        >
                            Wrong email?
                        </button>
                    </>
                )}
            </p>

            {!sent ? (
                <form onSubmit={sendCode}>
                    <div className="mb-5">
                        <label htmlFor="forgot-email" className="ui-label">Email</label>
                        <input
                            id="forgot-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            aria-invalid={!!emailError}
                            aria-describedby={emailError ? "forgot-email-error" : undefined}
                            className={`ui-input ${emailError ? "ui-input-invalid" : ""}`}
                        />
                        <FieldError id="forgot-email-error" message={emailError} />
                    </div>
                    <button type="submit" disabled={sending} className="ui-btn ui-btn-primary w-full">
                        {sending ? "Sending…" : "Send code"}
                    </button>
                </form>
            ) : (
                <form onSubmit={verify}>
                    <label className="ui-label" htmlFor="forgot-digit-0">Verification code</label>
                    <div role="group" aria-label="Verification code" className="flex justify-between gap-2">
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                id={`forgot-digit-${i}`}
                                ref={(el) => {
                                    inputRefs.current[i] = el;
                                }}
                                value={digit}
                                onChange={(e) => updateDigit(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                inputMode="numeric"
                                autoComplete={i === 0 ? "one-time-code" : "off"}
                                aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
                                aria-invalid={!!codeError || undefined}
                                aria-describedby={codeError ? "forgot-code-error" : undefined}
                                className={`ui-input h-12 w-full min-w-0 px-0 text-center text-title sm:h-14 ${codeError ? "ui-input-invalid" : ""}`}
                            />
                        ))}
                    </div>
                    <FieldError id="forgot-code-error" message={codeError} />

                    <div className="mt-5 mb-5">
                        <label htmlFor="forgot-new" className="ui-label">New password</label>
                        <PasswordField
                            id="forgot-new"
                            value={newPassword}
                            onChange={setNewPassword}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            invalid={!!passwordError}
                            describedBy={passwordError ? "forgot-password-error" : undefined}
                        />
                        <FieldError id="forgot-password-error" message={passwordError} />
                    </div>

                    <button type="submit" disabled={!ready || verifying} className="ui-btn ui-btn-primary w-full">
                        {verifying ? "Updating…" : "Reset password"}
                    </button>
                    <button type="button" onClick={resendCode} disabled={resending || cooldown > 0} className="ui-btn ui-btn-ghost mt-2 w-full">
                        {resending ? "Resending…" : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                    </button>
                </form>
            )}

            <SwitchLine>
                Remembered it? <LinkButton onClick={() => onSwitch("login")}>Back to sign in</LinkButton>
            </SwitchLine>
        </>
    );
}
