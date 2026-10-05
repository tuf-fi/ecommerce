"use client";

import { useState } from "react";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";
import { useAsyncAction } from "@/library/useAsyncAction";
import { ApiError } from "@/library/api/client";
import { changeCustomerPassword } from "@/library/api/auth";

export default function ChangePasswordPage() {
    const { showToast } = useStore();

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

            {/*
              Two real clusters instead of a flat stack of three equally-
              weighted fields: verifying who you are (current password) is a
              distinct task from setting the new credential (new + confirm),
              so a rule separates them — the old left column only ever held a
              single orphaned caption, not real content, so it's gone.
            */}
            <form onSubmit={changePassword} className="max-w-[420px]">
                <div className="mb-6 border-b border-ink/10 pb-6">
                    <label htmlFor="current-password" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Current Password</label>
                    <input
                        id="current-password"
                        type="password"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="new-password" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">New Password</label>
                    <input
                        id="new-password"
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                    />
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-grey">At least 8 characters — mix letters and numbers for a stronger password.</p>
                </div>
                <div className="mb-6">
                    <label htmlFor="confirm-password" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Confirm New Password</label>
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="••••••••"
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
    );
}
