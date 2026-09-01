"use client";

import { useState } from "react";
import { toast } from "sonner";
import Toggle from "@/components/ui/Toggle";
import { FIELD_LABEL, FIELD_INPUT, BTN_PRIMARY } from "@/components/admin/formClasses";

const CARD = "mb-6 bg-white";
const CARD_HEADER = "border-b border-ink/10 pb-4.5";
const CARD_TITLE = "m-0 text-[15px] font-medium text-ink";

export default function AdminSecuritySettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    function handleChangePassword(e: React.FormEvent) {
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
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password updated.");
    }

    function handleToggleTwoFactor(value: boolean) {
        // TODO: wire up real 2FA enrollment (TOTP/SMS) once the backend exists.
        setTwoFactorEnabled(value);
        toast.success(value ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
    }

    return (
        <div>
            <div className={CARD}>
                <div className={CARD_HEADER}>
                    <h3 className={CARD_TITLE}>Change Password</h3>
                </div>
                <form onSubmit={handleChangePassword} className="max-w-[420px] py-7">
                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={FIELD_INPUT}
                            autoComplete="current-password"
                        />
                    </div>
                    <div className="mb-4">
                        <label className={FIELD_LABEL}>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={FIELD_INPUT}
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="mb-5">
                        <label className={FIELD_LABEL}>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={FIELD_INPUT}
                            autoComplete="new-password"
                        />
                    </div>
                    <button type="submit" className={BTN_PRIMARY}>
                        Update Password
                    </button>
                </form>
            </div>

            <div className={CARD}>
                <div className={CARD_HEADER}>
                    <h3 className={CARD_TITLE}>Two-Factor Authentication</h3>
                </div>
                <div className="flex items-center justify-between gap-6 py-7">
                    <p className="m-0 max-w-[420px] text-[13px] leading-relaxed text-grey">
                        Add an extra verification step when signing in to this account.
                    </p>
                    <Toggle checked={twoFactorEnabled} onChange={handleToggleTwoFactor} />
                </div>
            </div>
        </div>
    );
}
