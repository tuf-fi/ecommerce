"use client";

import Modal from "@/components/ui/Modal";

export default function LoginRequiredModal({
    open,
    message = "You need to be signed in to view this page.",
    onLogin,
    onCancel,
}: {
    open: boolean;
    message?: string;
    onLogin: () => void;
    onCancel: () => void;
}) {
    return (
        <Modal open={open} onClose={onCancel} maxWidth="max-w-[400px]">
            <div className="p-8 text-center">
                <h3 className="mb-2 text-xl font-medium text-ink">Sign in required</h3>
                <p className="mb-6 text-[13px] leading-relaxed text-grey">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 border border-ink/15 py-3 text-[12.5px] font-semibold uppercase tracking-wide text-ink transition hover:bg-off/60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onLogin}
                        className="flex-1 bg-navy py-3 text-[12.5px] font-semibold uppercase tracking-wide text-white transition hover:bg-pink-dark"
                    >
                        Login
                    </button>
                </div>
            </div>
        </Modal>
    );
}
