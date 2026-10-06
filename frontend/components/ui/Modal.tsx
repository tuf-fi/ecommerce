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
    // Lets a modal render its own close button — e.g. LoginModal keeps the "×" glued to whichever side holds the form.
    hideDefaultClose?: boolean;
    // Accessible name Radix requires on every Dialog.Content; stays visually hidden, set only when there's no visible heading.
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
                        {/* pointer-events pass through this centering layer to the Overlay, so outside clicks still close the dialog. */}
                        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
                            <Dialog.Content asChild forceMount aria-describedby={undefined}>
                                <motion.div
                                    className={`pointer-events-auto relative flex max-h-[calc(100dvh-1.5rem)] w-full sm:max-h-[88vh] ${maxWidth} flex-col border border-ink/10 bg-white shadow-modal`}
                                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                    transition={{ duration: 0.28, ease: EASE }}
                                >
                                    <Dialog.Title asChild>
                                        <span className="sr-only">{title}</span>
                                    </Dialog.Title>
                                    {/* Close button is a sibling of the scrolling body, not inside it, so it stays put with long content. */}
                                    {!hideDefaultClose && (
                                        <Dialog.Close asChild>
                                            <button
                                                aria-label="Close"
                                                className="absolute top-3 right-3 z-20 flex h-10 w-10 sm:top-4 sm:right-4 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition hover:border-ink/25 hover:bg-off hover:text-ink"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                                    <path d="M5 5l14 14M19 5L5 19" />
                                                </svg>
                                            </button>
                                        </Dialog.Close>
                                    )}
                                    <div className="min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
