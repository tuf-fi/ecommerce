"use client";

import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { ViewHeader, DetailRow, DetailBody } from "@/components/admin/modals/ViewModalLayout";
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
            <ViewHeader
                title={staff.name}
                caption={staff.access}
                badge={<StatusBadge label={staff.role} tone={staff.role === "Administrator" ? "neutral" : "success"} />}
                thumbnail={
                    <div className="relative h-12 w-12 flex-none overflow-hidden rounded-full bg-blue-soft">
                        {staff.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={staff.photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink/60">
                                {staff.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                }
            />
            <DetailBody>
                <DetailRow label="Email" value={<span className="font-mono">{staff.email}</span>} />
            </DetailBody>
        </Modal>
    );
}
