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
    tone = "destructive",
    onConfirm,
    onClose,
}: {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    loadingLabel?: string;
    cancelLabel?: string;
    // Red is for actions that lose something; use "neutral" for ordinary confirmations.
    tone?: "destructive" | "neutral";
    // unknown, not void: call sites often pass `cond && fn()`, which returns false rather than undefined.
    onConfirm: () => unknown;
    onClose: () => void;
}) {
    const [confirming, confirm] = useAsyncAction(async () => {
        await onConfirm();
        onClose();
    });

    return (
        <Modal
            open={open}
            onClose={confirming ? () => {} : onClose}
            maxWidth="max-w-[420px]"
            heading={title}
            footer={
                <>
                    <button type="button" onClick={onClose} disabled={confirming} className="ui-btn ui-btn-secondary">
                        {cancelLabel}
                    </button>
                    <button type="button" onClick={confirm} disabled={confirming} className={`ui-btn ${tone === "neutral" ? "ui-btn-primary" : "ui-btn-destructive"}`}>
                        {confirming ? loadingLabel ?? ingForm(confirmLabel) : confirmLabel}
                    </button>
                </>
            }
        >
            {description && <p className="m-0 text-small leading-relaxed text-grey">{description}</p>}
        </Modal>
    );
}
