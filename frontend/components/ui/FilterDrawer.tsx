"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "./motion/constants";

// Right-hand drawer for the Shop filters below the `lg` breakpoint, where the sidebar column is hidden.
export default function FilterDrawer({
    open,
    onClose,
    title = "Filters",
    footer,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    footer?: React.ReactNode;
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
                        <Dialog.Content asChild forceMount aria-describedby={undefined}>
                            <motion.div
                                className="fixed inset-y-0 right-0 z-[60] flex w-[min(380px,100vw)] flex-col border-l border-ink/10 bg-white"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ duration: 0.3, ease: EASE }}
                            >
                                <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
                                    <Dialog.Title className="font-display text-subhead font-medium text-ink">{title}</Dialog.Title>
                                    <Dialog.Close asChild>
                                        <button aria-label="Close filters" className="-mr-2 flex h-11 w-11 items-center justify-center text-ink/60 transition hover:text-ink">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                                <path d="M5 5l14 14M19 5L5 19" />
                                            </svg>
                                        </button>
                                    </Dialog.Close>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
                                {footer && <div className="border-t border-ink/10 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
