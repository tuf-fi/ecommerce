"use client";

import { useState } from "react";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";

export default function ChangePasswordPage() {
    const { showToast } = useStore();

    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    function changePassword(e: React.FormEvent) {
        e.preventDefault();
        if (!currentPw || !newPw || newPw !== confirmPw) {
            showToast("error", newPw !== confirmPw ? "New passwords don't match." : "Fill in all fields.");
            return;
        }
        // TODO: verify current password and update it against the backend API.
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        showToast("success", "Password updated.");
    }

    return (
        <div>
            <PageHeading>Change Password</PageHeading>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
                <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                    <p className="max-w-[220px] text-[12.5px] leading-relaxed text-grey">
                        Use at least 8 characters — a mix of letters and numbers keeps your account safest.
                    </p>
                </div>

                <form onSubmit={changePassword} className="max-w-[420px]">
                    <div className="mb-4">
                        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Current Password</label>
                        <input
                            type="password"
                            value={currentPw}
                            onChange={(e) => setCurrentPw(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">New Password</label>
                        <input
                            type="password"
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30"
                        />
                    </div>
                    <div className="mb-5">
                        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30"
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 bg-navy px-7 py-3 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
}
