"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import AvatarUploadField from "@/components/admin/modals/AvatarUploadField";
import { StaffMember, StaffRole } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

const ACCESS_OPTIONS = ["Full access", "Inventory & orders only", "Inventory only", "Orders only", "Custom"];

// Mounted only while the modal is open (see StaffPage), so every field
// initializes fresh from `staff` with no effect needed to "reset" it.
export default function StaffModal({
    staff,
    onClose,
    onSave,
}: {
    staff: StaffMember | null;
    onClose: () => void;
    onSave: (data: Omit<StaffMember, "id">, id?: number) => void;
}) {
    const [name, setName] = useState(staff?.name ?? "");
    const [email, setEmail] = useState(staff?.email ?? "");
    const [role, setRole] = useState<StaffRole>(staff?.role ?? "Staff");
    const [access, setAccess] = useState(staff?.access ?? ACCESS_OPTIONS[1]);
    const [photo, setPhoto] = useState<string | undefined>(staff?.photo);

    function handleRoleChange(nextRole: StaffRole) {
        setRole(nextRole);
        if (nextRole === "Administrator") setAccess("Full access");
    }

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        if (!name.trim() || !email.trim()) return;
        await wait();
        onSave({ name: name.trim(), email: email.trim(), role, access, photo }, staff?.id);
        onClose();
    });

    return (
        <Modal open onClose={submitting ? () => {} : onClose} maxWidth="max-w-[460px]">
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                <h3 className="text-xl font-medium text-ink">{staff ? "Edit Staff" : "Add Staff"}</h3>
            </div>
            <div className="px-8 pt-6 pb-4">
                <AvatarUploadField photo={photo} onPhotoChange={setPhoto} name={name} placeholder="New staff member" />

                <div className="mb-4">
                    <label htmlFor="staff-name" className={FIELD_LABEL}>Full Name</label>
                    <input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Andrea Cruz" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label htmlFor="staff-email" className={FIELD_LABEL}>Email</label>
                    <input
                        id="staff-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@cindyrella.ph"
                        className={FIELD_INPUT}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="staff-role" className={FIELD_LABEL}>Role</label>
                    <select id="staff-role" value={role} onChange={(e) => handleRoleChange(e.target.value as StaffRole)} className={FIELD_INPUT}>
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
                        disabled={role === "Administrator"}
                        className={FIELD_INPUT}
                    >
                        {ACCESS_OPTIONS.map((a) => (
                            <option key={a}>{a}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-8 py-5">
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Saving…" : "Save Staff Account"}
                </button>
            </div>
        </Modal>
    );
}
