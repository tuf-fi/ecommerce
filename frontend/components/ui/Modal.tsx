"use client";

import { useEffect } from "react";

export default function Modal({
    open,
    onClose,
    maxWidth = "max-w-[520px]",
    children,
}: {
    open: boolean;
    onClose: () => void;
    maxWidth?: string;
    children: React.ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/50 p-5 backdrop-blur-sm" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className={`relative max-h-[88vh] w-full ${maxWidth} overflow-y-auto border border-ink/10 bg-white shadow-modal [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
            >
                <button
                    aria-label="Close"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center text-lg text-ink/50 transition hover:text-ink"
                >
                    ×
                </button>
                {children}
            </div>
        </div>
    );
}
