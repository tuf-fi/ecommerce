"use client";

import Modal from "./Modal";

export default function ConfirmModal({
    open,
    title,
    description,
    confirmLabel = "Remove",
    cancelLabel = "Cancel",
    onConfirm,
    onClose,
}: {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-[400px]">
            <div className="p-8">
                <h3 className="mb-2 text-xl font-medium text-ink">{title}</h3>
                {description && <p className="mb-6 text-[13px] leading-relaxed text-grey">{description}</p>}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 border border-ink/15 py-3 text-[12.5px] font-semibold uppercase tracking-wide text-ink transition hover:bg-off/60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 bg-alert py-3 text-[12.5px] font-semibold uppercase tracking-wide text-white transition hover:opacity-90"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
