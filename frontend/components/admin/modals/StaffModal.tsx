"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import AvatarUploadField from "@/components/admin/modals/AvatarUploadField";
import { StaffMember, StaffRole } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR } from "@/components/admin/formClasses";
import { useIsDirty } from "@/components/admin/useIsDirty";
import { useAsyncAction } from "@/library/useAsyncAction";
import type { StaffPatch } from "@/library/api/admin";
import { useAdminStore } from "@/library/adminStore";
import { isAdministrator } from "@/library/admin/permissions";
import { toast } from "sonner";

const ACCESS_OPTIONS = ["Full access", "Inventory & orders only", "Inventory only", "Orders only", "Custom"];

// Mounted only while open, so fields init fresh from `staff` with no reset effect needed.
export default function StaffModal({
    staff,
    onClose,
    onSave,
}: {
    staff: StaffMember | null;
    onClose: () => void;
    // New accounts need a password; an edit sends only the fields that changed. Resolves false when the server refused it, which keeps the form open.
    onSave: (data: Omit<StaffMember, "id"> & { password?: string }, id?: number, changes?: StaffPatch) => Promise<boolean>;
}) {
    const [name, setName] = useState(staff?.name ?? "");
    const [email, setEmail] = useState(staff?.email ?? "");
    const [role, setRole] = useState<StaffRole>(staff?.role ?? "Staff");
    const [access, setAccess] = useState(staff?.access ?? ACCESS_OPTIONS[1]);
    const [photo, setPhoto] = useState<string | undefined>(staff?.photo);
    const [password, setPassword] = useState("");
    const [active, setActive] = useState(staff?.active ?? true);
    const [resetTwoFactor, setResetTwoFactor] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
    const { currentStaffMember } = useAdminStore();
    // Cosmetic-only defense in depth — sidebar already hides this page from non-Administrators, this covers direct navigation.
    const canEditRole = isAdministrator(currentStaffMember);

    // You can't change your own role, access or active status (so you can't lock yourself out); the server refuses it too.
    const isSelf = staff !== null && currentStaffMember?.id === staff.id;
    const isDirty = useIsDirty({ name, email, role, access, photo, password, active, resetTwoFactor });

    function requestClose() {
        if (isDirty) setConfirmCloseOpen(true);
        else onClose();
    }

    function handleRoleChange(nextRole: StaffRole) {
        setRole(nextRole);
        if (nextRole === "Administrator") setAccess("Full access");
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const trimmedEmail = email.trim();
        const nextErrors: { name?: string; email?: string } = {};
        if (!name.trim()) nextErrors.name = "Name is required.";
        if (!trimmedEmail) nextErrors.email = "Email is required.";
        else if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) nextErrors.email = "Enter a valid email address.";
        if (nextErrors.name || nextErrors.email) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        if (!staff && password.length < 8) {
            toast.error("Give the new account a password of at least 8 characters.");
            return;
        }
        if (staff && password && password.length < 8) {
            toast.error("A new password needs at least 8 characters.");
            return;
        }
        setErrors({});
        const data = { name: name.trim(), email: trimmedEmail, role, access, photo, active, password: password || undefined };
        // For an edit, only what actually changed is sent.
        const changes: StaffPatch | undefined = staff
            ? {
                  ...(data.name !== staff.name ? { name: data.name } : {}),
                  ...(data.email !== staff.email ? { email: data.email } : {}),
                  ...(data.role !== staff.role ? { role: data.role } : {}),
                  ...(data.access !== staff.access ? { access: data.access } : {}),
                  ...(data.photo !== staff.photo ? { photo: data.photo } : {}),
                  ...(data.active !== (staff.active ?? true) ? { active: data.active } : {}),
                  ...(password ? { password } : {}),
                  ...(resetTwoFactor ? { resetTwoFactor: true as const } : {}),
              }
            : undefined;
        if (staff && changes && Object.keys(changes).length === 0) {
            onClose();
            return;
        }
        if (await onSave(data, staff?.id, changes)) onClose();
    });

    return (
        <>
        <Modal open onClose={submitting ? () => {} : requestClose} maxWidth="max-w-[460px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{staff ? "Edit Staff" : "Add Staff"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <AvatarUploadField photo={photo} onPhotoChange={setPhoto} name={name} placeholder="New staff member" />

                <div className="mb-4">
                    <label htmlFor="staff-name" className={FIELD_LABEL}>Full Name</label>
                    <input
                        id="staff-name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                        }}
                        placeholder="e.g. Andrea Cruz"
                        aria-invalid={errors.name ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.name ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.name && <p className={FIELD_ERROR}>{errors.name}</p>}
                </div>

                <div className="mb-4">
                    <label htmlFor="staff-email" className={FIELD_LABEL}>Email</label>
                    <input
                        id="staff-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors((er) => ({ ...er, email: undefined }));
                        }}
                        placeholder="name@cindyrella.ph"
                        aria-invalid={errors.email ? true : undefined}
                        className={`${FIELD_INPUT} ${errors.email ? FIELD_INPUT_INVALID : ""}`}
                    />
                    {errors.email && <p className={FIELD_ERROR}>{errors.email}</p>}
                </div>

                {/* Paired, not stacked — Access is disabled/derived the moment Role is Administrator (see handleRoleChange). */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="staff-role" className={FIELD_LABEL}>Role</label>
                        <select
                            id="staff-role"
                            value={role}
                            onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
                            disabled={!canEditRole || isSelf}
                            className={FIELD_INPUT}
                        >
                            <option>Administrator</option>
                            <option>Staff</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="staff-access" className={FIELD_LABEL}>Access</label>
                        <select
                            id="staff-access"
                            value={access}
                            onChange={(e) => setAccess(e.target.value)}
                            disabled={role === "Administrator" || !canEditRole || isSelf}
                            className={FIELD_INPUT}
                        >
                            {ACCESS_OPTIONS.map((a) => (
                                <option key={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <label htmlFor="staff-password" className={FIELD_LABEL}>{staff ? "Set a new password (optional)" : "Password"}</label>
                    <input
                        id="staff-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder={staff ? "Leave blank to keep the current one" : "At least 8 characters"}
                        className={FIELD_INPUT}
                    />
                    <p className="mt-1.5 text-[11.5px] text-grey">
                        {staff ? "Setting a password signs them out everywhere." : "Share it with them securely; they can change it under Settings → Security."}
                    </p>
                </div>

                {staff && (
                    <div className="mt-5 flex flex-col gap-3 border-t border-ink/10 pt-5">
                        <label className={`flex items-center gap-2.5 text-[13px] text-ink ${isSelf ? "opacity-50" : ""}`}>
                            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} disabled={isSelf} className="accent-pink-btn" />
                            Account is active (unticked accounts can&apos;t sign in)
                        </label>
                        {staff.twoFactorEnabled && (
                            <label className="flex items-center gap-2.5 text-[13px] text-ink">
                                <input type="checkbox" checked={resetTwoFactor} onChange={(e) => setResetTwoFactor(e.target.checked)} className="accent-pink-btn" />
                                Turn off their two-factor (they lost their phone and recovery codes)
                            </label>
                        )}
                    </div>
                )}
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Staff Account"}
                </button>
            </div>
        </Modal>
        <ConfirmModal
            open={confirmCloseOpen}
            title="Discard changes?"
            description="Your edits to this staff account haven't been saved."
            confirmLabel="Discard"
            onConfirm={onClose}
            onClose={() => setConfirmCloseOpen(false)}
        />
        </>
    );
}
