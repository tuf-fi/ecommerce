"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { StaffMember, StaffRole } from "@/library/admin/types";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";

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

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPhoto(reader.result as string);
        reader.readAsDataURL(file);
    }

    function handleRoleChange(nextRole: StaffRole) {
        setRole(nextRole);
        if (nextRole === "Administrator") setAccess("Full access");
    }

    function handleSubmit() {
        if (!name.trim() || !email.trim()) return;
        onSave({ name: name.trim(), email: email.trim(), role, access, photo }, staff?.id);
        onClose();
    }

    return (
        <Modal open onClose={onClose} maxWidth="max-w-[460px]">
            <div className="p-8">
                <h3 className="mb-5 text-xl font-medium text-ink">{staff ? "Edit Staff" : "Add Staff"}</h3>

                <div className="mb-5 flex items-center gap-4">
                    <label className="relative h-16 w-16 flex-none cursor-pointer overflow-hidden rounded-full bg-blue-soft">
                        {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-ink/60">
                                {name.charAt(0).toUpperCase() || "+"}
                            </span>
                        )}
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                    <div>
                        <div className="text-[13.5px] font-medium text-ink">{name || "New staff member"}</div>
                        <label className="mt-1 block cursor-pointer text-[12px] text-pink-dark underline decoration-1 underline-offset-2 hover:text-pink-dark/80">
                            Change photo
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Andrea Cruz" className={FIELD_INPUT} />
                </div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@cindyrella.ph"
                        className={FIELD_INPUT}
                    />
                </div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Role</label>
                    <select value={role} onChange={(e) => handleRoleChange(e.target.value as StaffRole)} className={FIELD_INPUT}>
                        <option>Administrator</option>
                        <option>Staff</option>
                    </select>
                </div>

                <div className="mb-6">
                    <label className={FIELD_LABEL}>Access</label>
                    <select
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

                <button onClick={handleSubmit} className={`w-full ${BTN_PRIMARY}`}>
                    Save Staff Account
                </button>
            </div>
        </Modal>
    );
}
