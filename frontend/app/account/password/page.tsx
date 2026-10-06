"use client";

import { useState } from "react";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";
import { useAsyncAction } from "@/library/useAsyncAction";
import { ApiError } from "@/library/api/client";
import { changeCustomerPassword } from "@/library/api/auth";

const LABEL = "mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey";
const INPUT = "w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1";

export default function ChangePasswordPage() {
    const { showToast, signOutEverywhere } = useStore();

    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    const [submitting, changePassword] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPw || !newPw || newPw !== confirmPw) {
            showToast("error", newPw !== confirmPw ? "New passwords don't match." : "Fill in all fields.");
            return;
        }
        if (newPw.length < 8) {
            showToast("error", "Use at least 8 characters.");
            return;
        }
        try {
            await changeCustomerPassword({ currentPassword: currentPw, newPassword: newPw });
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
            showToast("success", "Password updated.");
        } catch (err) {
            showToast("error", err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        }
    });

    return (
        <div>
            <PageHeading>Change Password</PageHeading>

            <div>
                <div className="mb-6 flex flex-col gap-4 border border-ink/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                    <div>
                        <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[.14em] text-grey">Signed in somewhere else?</div>
                        <p className="max-w-[44ch] text-[12.5px] leading-relaxed text-grey">This signs you out on every phone and computer, including this one. You&apos;ll need to sign in again.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void signOutEverywhere()}
                        className="flex-none border border-ink/15 px-6 py-3 text-[13px] font-semibold tracking-wide text-ink transition hover:border-alert hover:text-alert"
                    >
                        Sign out of all devices
                    </button>
                </div>

                <form onSubmit={changePassword} className="border border-ink/10 bg-white">
                    <div className="flex flex-col gap-6 p-6 sm:p-7">
                        <div>
                            <label htmlFor="current-password" className={LABEL}>Current Password</label>
                            <input id="current-password" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" className={INPUT} />
                        </div>
                        <div className="h-px bg-ink/10" aria-hidden="true" />
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="new-password" className={LABEL}>New Password</label>
                                <input id="new-password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" className={INPUT} />
                                <p className="mt-2 text-[12px] leading-relaxed text-grey">At least 8 characters. Mix letters and numbers.</p>
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className={LABEL}>Confirm New Password</label>
                                <input id="confirm-password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" className={INPUT} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end border-t border-ink/10 bg-off/40 px-6 py-4 sm:px-7">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="min-w-[168px] bg-navy px-6 py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-navy"
                        >
                            {submitting ? "Updating…" : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
