"use client";

import Modal from "./Modal";
import { useAsyncAction } from "@/library/useAsyncAction";

// Converts confirmLabel to its -ing form ("Remove" -> "Removing…") for a default loading label.
function ingForm(label: string) {
    return `${label.endsWith("e") ? label.slice(0, -1) : label}ing…`;
}

export default function ConfirmModal({
    open,
    title,
    description,
    confirmLabel = "Remove",
    loadingLabel,
    cancelLabel = "Cancel",
    onConfirm,
    onClose,
}: {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    loadingLabel?: string;
    cancelLabel?: string;
    // unknown, not void: call sites often pass `cond && fn()`, which returns false rather than undefined.
    onConfirm: () => unknown;
    onClose: () => void;
}) {
    const [confirming, confirm] = useAsyncAction(async () => {
        await onConfirm();
        onClose();
    });

    return (
        <Modal open={open} onClose={confirming ? () => {} : onClose} maxWidth="max-w-[400px]">
            <div className="p-6 text-center sm:p-8">
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-alert/10 text-alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 7h16" />
                        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
                        <path d="M10 11v6M14 11v6" />
                    </svg>
                </span>
                <h3 className="mb-2 text-xl font-medium text-ink">{title}</h3>
                {description && <p className="mb-6 text-[13px] leading-relaxed text-grey">{description}</p>}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={confirming}
                        className="flex-1 border border-ink/15 py-3 text-[12.5px] font-semibold uppercase tracking-wide text-ink transition hover:bg-off/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={confirm}
                        disabled={confirming}
                        className="flex-1 bg-alert py-3 text-[12.5px] font-semibold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:opacity-60"
                    >
                        {confirming ? loadingLabel ?? ingForm(confirmLabel) : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
