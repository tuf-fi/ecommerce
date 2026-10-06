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
            <SettingsSection title="Change Password" aside="Use at least 8 characters — a mix of letters and numbers keeps this account safest.">
                <form onSubmit={handleChangePassword} className="border border-ink/10 bg-white">
                    <div className="flex flex-col gap-5 p-6 sm:p-7">
                        <PasswordField id="current-password" label="Current Password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
                        <div className="h-px bg-ink/10" aria-hidden="true" />
                        <div className="grid gap-5 sm:grid-cols-2">
                            <PasswordField id="new-password" label="New Password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
                            <PasswordField id="confirm-password" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end border-t border-ink/10 bg-off/40 px-6 py-4 sm:px-7">
                        <button type="submit" disabled={submitting} className={`${BTN_PRIMARY} min-w-[168px]`}>
                            {submitting ? "Updating…" : "Update Password"}
                        </button>
                    </div>
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

function PasswordField({
    id,
    label,
    value,
    onChange,
    autoComplete,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete: string;
}) {
    const [shown, setShown] = useState(false);
    return (
        <div>
            <label htmlFor={id} className={FIELD_LABEL}>{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={shown ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    className={`${FIELD_INPUT} pr-12`}
                />
                <button
                    type="button"
                    onClick={() => setShown((v) => !v)}
                    aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    aria-pressed={shown}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-grey transition hover:text-ink focus-visible:text-ink focus-visible:outline-none"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                        {shown && <path d="M4 4l16 16" />}
                    </svg>
                </button>
            </div>
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
                <div>
                    <Skeleton tone="soft" className="mb-7 h-4 w-80 max-w-full" />
                    <div className="border border-ink/10">
                        <div className="flex flex-col gap-5 p-6 sm:p-7">
                            <Skeleton tone="outline" className="h-[66px] w-full" />
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Skeleton tone="outline" className="h-[66px] w-full" />
                                <Skeleton tone="outline" className="h-[66px] w-full" />
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-ink/10 px-7 py-4">
                            <Skeleton tone="outline" className="h-[45px] w-[168px]" />
                        </div>
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
