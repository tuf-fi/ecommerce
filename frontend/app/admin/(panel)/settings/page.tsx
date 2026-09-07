"use client";

import { useState } from "react";
import { toast } from "sonner";
import Toggle from "@/components/ui/Toggle";
import PageHeading from "@/components/ui/PageHeading";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

export default function AdminSecuritySettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const [submitting, handleChangePassword] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Fill in all password fields.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirmation don't match.");
            return;
        }
        // TODO: verify current password and update it against the backend API.
        await wait();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password updated.");
    });

    function handleToggleTwoFactor(value: boolean) {
        // TODO: wire up real 2FA enrollment (TOTP/SMS) once the backend exists.
        setTwoFactorEnabled(value);
        toast.success(value ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
    }

    return (
        <div>
            <PageHeading>Change Password</PageHeading>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
                <p className="max-w-[220px] text-[12.5px] leading-relaxed text-grey">
                    Use at least 8 characters — a mix of letters and numbers keeps this account safest.
                </p>

                <form onSubmit={handleChangePassword} className="max-w-[420px]">
                    <div className="mb-4">
                        <label htmlFor="current-password" className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Current Password</label>
                        <input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="new-password" className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">New Password</label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                        />
                    </div>
                    <div className="mb-5">
                        <label htmlFor="confirm-password" className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Confirm New Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 bg-navy px-7 py-3 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy"
                    >
                        {!submitting && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                        )}
                        {submitting ? "Updating…" : "Update Password"}
                    </button>
                </form>
            </div>

            <div className="mt-12">
                <PageHeading>Two-Factor Authentication</PageHeading>
                <div className="flex items-center justify-between gap-6">
                    <p className="max-w-[420px] text-[13px] leading-relaxed text-grey">
                        Add an extra verification step when signing in to this account.
                    </p>
                    <Toggle checked={twoFactorEnabled} onChange={handleToggleTwoFactor} ariaLabel="Two-Factor Authentication" />
                </div>
            </div>
        </div>
    );
}
