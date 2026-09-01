"use client";

import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { StaffMember } from "@/library/admin/types";

export default function StaffViewModal({
    open,
    staff,
    onClose,
}: {
    open: boolean;
    staff: StaffMember | null;
    onClose: () => void;
}) {
    if (!staff) return null;

    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-[380px]">
            <div className="p-8 text-center">
                <div className="relative mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full bg-blue-soft">
                    {staff.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={staff.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-ink/60">
                            {staff.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <h3 className="mb-1.5 text-xl font-medium text-ink">{staff.name}</h3>
                <div className="mb-5">
                    <StatusBadge label={staff.role} tone={staff.role === "Administrator" ? "neutral" : "success"} />
                </div>
                <div className="mb-6 border border-ink/10 bg-off/60 p-4 text-left text-[13px] leading-relaxed text-ink/85">
                    <div className="mb-2.5">
                        <span className="font-mono text-[10px] tracking-[.14em] text-grey uppercase">Email</span>
                        <div>{staff.email}</div>
                    </div>
                    <div>
                        <span className="font-mono text-[10px] tracking-[.14em] text-grey uppercase">Access</span>
                        <div>{staff.access}</div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
