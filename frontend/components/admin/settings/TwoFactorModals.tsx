"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { ApiError } from "@/library/api/client";
import { disableTwoFactor, enableTwoFactor, startTwoFactorSetup } from "@/library/api/auth";

const message = (err: unknown) => (err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");

type Setup = { secret: string; qrDataUrl: string };

// Mounted only while open, so every field starts fresh each time it is opened.
export function TwoFactorSetupModal({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
    const [setup, setSetup] = useState<Setup | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);

    async function begin() {
        setBusy(true);
        try {
            setSetup(await startTwoFactorSetup());
        } catch (err) {
            toast.error(message(err));
            onClose();
        } finally {
            setBusy(false);
        }
    }

    async function confirm(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            const { recoveryCodes: codes } = await enableTwoFactor(code.trim());
            setRecoveryCodes(codes);
            onEnabled();
        } catch (err) {
            toast.error(message(err));
        } finally {
            setBusy(false);
        }
    }

    // Recovery codes are shown once, so closing is only offered after they've been seen.
    const close = recoveryCodes ? onClose : busy ? () => {} : onClose;

    return (
        <Modal open onClose={close} maxWidth="max-w-[440px]" title="Two-factor authentication">
            <div className="p-8">
                {recoveryCodes ? (
                    <>
                        <h3 className="mb-1 text-xl font-medium text-ink">Save your recovery codes</h3>
                        <p className="mb-5 text-[12.5px] leading-relaxed text-grey">
                            Each code works once if you lose your phone. They won&apos;t be shown again, so store them somewhere safe.
                        </p>
                        <div className="mb-5 grid grid-cols-2 gap-2 border border-ink/10 bg-off p-4 font-mono text-[13px] text-ink">
                            {recoveryCodes.map((c) => (
                                <span key={c}>{c}</span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(recoveryCodes.join("\n")).then(() => toast.success("Copied."))}
                                className={BTN_SECONDARY}
                            >
                                Copy
                            </button>
                            <button type="button" onClick={onClose} className={`flex-1 ${BTN_PRIMARY}`}>
                                I&apos;ve saved them
                            </button>
                        </div>
                    </>
                ) : !setup ? (
                    <>
                        <h3 className="mb-1 text-xl font-medium text-ink">Turn on two-factor authentication</h3>
                        <p className="mb-5 text-[12.5px] leading-relaxed text-grey">
                            You&apos;ll scan a QR code with an authenticator app (Google Authenticator, 1Password, Authy…) and enter the code it shows each time you sign in.
                        </p>
                        <button type="button" onClick={begin} disabled={busy} className={`w-full ${BTN_PRIMARY}`}>
                            {busy ? "Preparing…" : "Continue"}
                        </button>
                    </>
                ) : (
                    <form onSubmit={confirm}>
                        <h3 className="mb-1 text-xl font-medium text-ink">Scan, then confirm</h3>
                        <p className="mb-4 text-[12.5px] text-grey">Scan this with your authenticator app, then enter the 6-digit code it shows.</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={setup.qrDataUrl} alt="QR code for your authenticator app" width={180} height={180} className="mx-auto mb-3 border border-ink/10" />
                        <p className="mb-5 break-all text-center font-mono text-[11px] text-grey">
                            Can&apos;t scan? Enter this key: <span className="text-ink">{setup.secret}</span>
                        </p>
                        <label htmlFor="twofactor-code" className={FIELD_LABEL}>6-digit code</label>
                        <input
                            id="twofactor-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            className={`${FIELD_INPUT} mb-5`}
                        />
                        <button type="submit" disabled={busy || code.length !== 6} className={`w-full ${BTN_PRIMARY}`}>
                            {busy ? "Verifying…" : "Turn on"}
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
}

export function TwoFactorDisableModal({ onClose, onDisabled }: { onClose: () => void; onDisabled: () => void }) {
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            await disableTwoFactor({ password, code: code.trim() });
            toast.success("Two-factor authentication turned off.");
            onDisabled();
            onClose();
        } catch (err) {
            toast.error(message(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal open onClose={busy ? () => {} : onClose} maxWidth="max-w-[420px]" title="Turn off two-factor authentication">
            <form onSubmit={submit} className="p-8">
                <h3 className="mb-1 text-xl font-medium text-ink">Turn off two-factor?</h3>
                <p className="mb-5 text-[12.5px] leading-relaxed text-grey">Confirm with your password and a current code from your authenticator app.</p>
                <label htmlFor="twofactor-off-password" className={FIELD_LABEL}>Password</label>
                <input
                    id="twofactor-off-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className={`${FIELD_INPUT} mb-4`}
                />
                <label htmlFor="twofactor-off-code" className={FIELD_LABEL}>6-digit code</label>
                <input
                    id="twofactor-off-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={`${FIELD_INPUT} mb-5`}
                />
                <button type="submit" disabled={busy || !password || code.length !== 6} className={`w-full ${BTN_PRIMARY}`}>
                    {busy ? "Turning off…" : "Turn off"}
                </button>
            </form>
        </Modal>
    );
}
