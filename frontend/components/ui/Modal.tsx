"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "./motion/constants";

export default function Modal({
    open,
    onClose,
    maxWidth = "max-w-[520px]",
    hideDefaultClose = false,
    title = "Dialog",
    children,
}: {
    open: boolean;
    onClose: () => void;
    maxWidth?: string;
    // Lets a modal render its own close button instead — e.g. LoginModal,
    // whose content slides side to side, keeps the "×" glued to whichever
    // side currently holds the form so it never sits on top of the photo.
    hideDefaultClose?: boolean;
    // Accessible name for screen readers — Radix requires every Dialog.Content
    // to have one. Most call sites already render their own visible heading,
    // so this stays visually hidden and only needs to be set when that visible
    // heading is missing or unhelpful out of context.
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
            <AnimatePresence>
                {open && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div
                                className="fixed inset-0 z-[60] bg-navy/50 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.22, ease: EASE }}
                            />
                        </Dialog.Overlay>
                        {/* Non-interactive centering layer — pointer-events pass through it
                            to the Overlay behind, so clicking outside the content still
                            counts as an outside click and closes the dialog. */}
                        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-5">
                            <Dialog.Content asChild forceMount aria-describedby={undefined}>
                                <motion.div
                                    className={`pointer-events-auto relative flex max-h-[88vh] w-full ${maxWidth} flex-col border border-ink/10 bg-white shadow-modal`}
                                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                    transition={{ duration: 0.28, ease: EASE }}
                                >
                                    <Dialog.Title asChild>
                                        <span className="sr-only">{title}</span>
                                    </Dialog.Title>
                                    {/* The close button lives here, a sibling of the scrolling body below —
                                        not inside it — so it stays put at top-right instead of scrolling
                                        away with long content. */}
                                    {!hideDefaultClose && (
                                        <Dialog.Close asChild>
                                            <button
                                                aria-label="Close"
                                                className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center text-lg text-ink/50 transition hover:text-ink"
                                            >
                                                ×
                                            </button>
                                        </Dialog.Close>
                                    )}
                                    <div className="min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        {children}
                                    </div>
                                </motion.div>
                            </Dialog.Content>
                        </div>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
