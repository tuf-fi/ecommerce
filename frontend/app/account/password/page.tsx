"use client";

import { useState } from "react";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";
import { useAsyncAction } from "@/library/useAsyncAction";
import { ApiError } from "@/library/api/client";
import { changeCustomerPassword } from "@/library/api/auth";

const LABEL = "ui-label";
const INPUT = "ui-input";

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

            <section className="mb-6 flex flex-col gap-4 border border-ink/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                <div>
                    <h2 className="font-mono text-label uppercase tracking-[.14em] text-ink">Signed in somewhere else?</h2>
                    <p className="mt-1.5 max-w-[56ch] text-small leading-relaxed text-grey">This signs you out on every phone and computer, including this one. You&apos;ll need to sign in again.</p>
                </div>
                <button
                    type="button"
                    onClick={() => void signOutEverywhere()}
                    className="ui-btn ui-btn-danger ui-btn-sm flex-none self-start sm:self-auto"
                >
                    Sign out of all devices
                </button>
            </section>

            <form onSubmit={changePassword} className="border border-ink/10 bg-white p-6">
                <h2 className="font-mono text-label uppercase tracking-[.14em] text-ink">Update your password</h2>
                <p className="mt-1.5 text-small text-grey">At least 8 characters, with letters and numbers.</p>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <div>
                        <label htmlFor="current-password" className={LABEL}>Current</label>
                        <input id="current-password" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" className={INPUT} />
                    </div>
                    <div>
                        <label htmlFor="new-password" className={LABEL}>New</label>
                        <input id="new-password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" className={INPUT} />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className={LABEL}>Confirm new</label>
                        <input id="confirm-password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" className={INPUT} />
                    </div>
                </div>
                <div className="mt-5 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="ui-btn ui-btn-primary"
                    >
                        {submitting ? "Updating…" : "Update Password"}
                    </button>
                </div>
            </form>
        </div>
    );
}
