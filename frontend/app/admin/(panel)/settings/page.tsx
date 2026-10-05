"use client";

import { useState } from "react";
import { toast } from "sonner";
import Toggle from "@/components/ui/Toggle";
import { useAsyncAction } from "@/library/useAsyncAction";
import { useAdminStore } from "@/library/adminStore";
import { ApiError } from "@/library/api/client";
import { changeAdminPassword } from "@/library/api/auth";
import { TwoFactorDisableModal, TwoFactorSetupModal } from "@/components/admin/settings/TwoFactorModals";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { SettingsSection, SettingsList, SettingsRow } from "@/components/admin/settings/SettingsSection";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function AdminSecuritySettingsPage() {
    const mounted = useMounted();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const { twoFactorEnabled, reloadSession } = useAdminStore();
    const [twoFactorDialog, setTwoFactorDialog] = useState<"setup" | "disable" | null>(null);

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
        try {
            const { signedOutElsewhere } = await changeAdminPassword({ currentPassword, newPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success(signedOutElsewhere > 0 ? "Password updated. Your other devices were signed out." : "Password updated.");
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        }
    });

    // The switch only opens the dialog; it flips once the server confirms (the session is re-read afterwards).
    function handleToggleTwoFactor(value: boolean) {
        setTwoFactorDialog(value ? "setup" : "disable");
    }

    if (!mounted) return <SecuritySettingsSkeleton />;

    return (
        <div>
            {/* The one genuine form on this page gets the explanatory aside; the toggle list below is self-explanatory. */}
            <SettingsSection title="Change Password" aside="Use at least 8 characters — a mix of letters and numbers keeps this account safest.">
                <form onSubmit={handleChangePassword}>
                    <div className="mb-4">
                        <label htmlFor="current-password" className={FIELD_LABEL}>Current Password</label>
                        <input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="new-password" className={FIELD_LABEL}>New Password</label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div className="mb-5">
                        <label htmlFor="confirm-password" className={FIELD_LABEL}>Confirm New Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={FIELD_INPUT}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`inline-flex items-center gap-2 ${BTN_PRIMARY}`}
                    >
                        {!submitting && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                        )}
                        {submitting ? "Updating…" : "Update Password"}
                    </button>
                </form>
            </SettingsSection>

            <SettingsSection title="Two-Factor Authentication">
                <SettingsList>
                    <SettingsRow
                        label="Require a code at sign-in"
                        description="Ask for a code from an authenticator app each time you sign in to this account."
                        control={<Toggle checked={twoFactorEnabled} onChange={handleToggleTwoFactor} ariaLabel="Two-Factor Authentication" />}
                    />
                </SettingsList>
            </SettingsSection>

            {twoFactorDialog === "setup" && <TwoFactorSetupModal onClose={() => setTwoFactorDialog(null)} onEnabled={() => void reloadSession()} />}
            {twoFactorDialog === "disable" && <TwoFactorDisableModal onClose={() => setTwoFactorDialog(null)} onDisabled={() => void reloadSession()} />}
        </div>
    );
}

function SecuritySettingsSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-12">
                <div className="mb-6 flex h-10 items-center border-b border-ink/10 pb-4">
                    <Skeleton className="h-[18px] w-40" />
                </div>
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
                    <Skeleton tone="soft" className="h-[42px] w-[220px]" />
                    <div className="max-w-[420px]">
                        <div className="mb-4">
                            <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-28" />
                            <Skeleton tone="outline" className="h-11 w-full" />
                        </div>
                        <div className="mb-4">
                            <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-24" />
                            <Skeleton tone="outline" className="h-11 w-full" />
                        </div>
                        <div className="mb-5">
                            <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-36" />
                            <Skeleton tone="outline" className="h-11 w-full" />
                        </div>
                        <Skeleton tone="outline" className="h-[45px] w-40" />
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-6 flex h-10 items-center border-b border-ink/10 pb-4">
                    <Skeleton className="h-[18px] w-56" />
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-ink/10 py-4">
                    <div>
                        <Skeleton className="h-[13.5px] w-48" />
                        <Skeleton tone="soft" className="mt-1.5 h-3 w-64" />
                    </div>
                    <Skeleton tone="outline" className="h-6 w-11 rounded-pill" />
                </div>
            </div>
        </SkeletonGroup>
    );
}
