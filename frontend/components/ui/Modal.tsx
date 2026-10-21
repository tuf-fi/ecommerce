"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "./motion/constants";

// Footer buttons: primary first on phones (full width, stacked), primary last on the right from sm.
// Cancel-style buttons in a footer: closing through Radix keeps them behind the same discard guard as Esc and the close button.
export const ModalClose = Dialog.Close;
// For a modal whose own visible heading should name the dialog (use with `titleInBody`).
export const ModalTitle = Dialog.Title;

export const MODAL_ACTIONS = "flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end";

export default function Modal({
    open,
    onClose,
    maxWidth = "max-w-[520px]",
    hideDefaultClose = false,
    title = "Dialog",
    heading,
    eyebrow,
    footer,
    dirty = false,
    onOpenAutoFocus,
    headerAction,
    flush = false,
    titleInBody = false,
    variant = "default",
    children,
}: {
    open: boolean;
    onClose: () => void;
    maxWidth?: string;
    // Lets a modal render its own close button.
    hideDefaultClose?: boolean;
    // Accessible name for modals without a visible `heading`; stays visually hidden.
    title?: string;
    // Visible title. When set, Modal draws the header (eyebrow, title, close), pads the body, and names the dialog with it.
    heading?: string;
    eyebrow?: string;
    // Sticky action row, kept outside the scrolling body so it never sits under the keyboard or a long form.
    footer?: React.ReactNode;
    // Closing while dirty asks to discard first instead of dropping typed input.
    dirty?: boolean;
    // Lets a modal choose what gets focus on open (default: the first focusable element, i.e. the close button).
    onOpenAutoFocus?: (e: Event) => void;
    // Control shown beside the title (e.g. a status select).
    headerAction?: React.ReactNode;
    // Skip the body padding when the content runs its own full-bleed rows.
    flush?: boolean;
    // "viewer" is a dark, borderless panel for looking at an image.
    variant?: "default" | "viewer";
    // The body renders its own <ModalTitle>, so no hidden one is added.
    titleInBody?: boolean;
    children: React.ReactNode;
}) {
    const [discarding, setDiscarding] = useState(false);

    // A parent-driven close (e.g. after a successful save) must not leave the discard prompt armed for the next open.
    if (!open && discarding) setDiscarding(false);

    function attemptClose() {
        if (discarding) {
            // Esc or a backdrop click while the prompt is up means "keep editing", never "discard".
            setDiscarding(false);
            return;
        }
        if (dirty) {
            setDiscarding(true);
            return;
        }
        onClose();
    }

    const closeButton = (
        <Dialog.Close asChild>
            <button
                type="button"
                aria-label="Close"
                className={`flex h-11 w-11 flex-none items-center justify-center transition focus-visible:ring-2 ${variant === "viewer" ? "text-white/80 hover:text-white focus-visible:ring-white" : "text-ink/60 hover:text-ink focus-visible:ring-navy focus-visible:ring-offset-2"}`}
            >
                <svg width={variant === "viewer" ? 20 : 14} height={variant === "viewer" ? 20 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 5l14 14M19 5L5 19" />
                </svg>
            </button>
        </Dialog.Close>
    );

    const showFooter = footer || discarding;

    return (
        <Dialog.Root open={open} onOpenChange={(next) => !next && attemptClose()}>
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
                        <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-5">
                            <Dialog.Content asChild forceMount aria-describedby={undefined} onOpenAutoFocus={onOpenAutoFocus}>
                                <motion.div
                                    className={`pointer-events-auto relative flex outline-none max-h-[92dvh] sm:max-h-[88vh] ${maxWidth} flex-col ${variant === "viewer" ? "h-full !max-h-none w-full !max-w-none" : "w-full shadow-modal border border-b-0 border-ink/10 bg-white sm:border-b"}`}
                                    initial={{ opacity: 0, y: 28 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.28, ease: EASE }}
                                >
                                    {heading ? (
                                        <div className={`flex flex-none items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-8 sm:pt-7 ${flush ? "border-b border-ink/10" : ""}`}>
                                            <div className="min-w-0">
                                                {eyebrow && <div className="mb-1.5 font-mono text-label uppercase tracking-[.16em] text-grey">{eyebrow}</div>}
                                                <Dialog.Title className="m-0 text-subhead font-medium text-ink">{heading}</Dialog.Title>
                                            </div>
                                            <div className={`flex flex-none items-center gap-3 ${!hideDefaultClose && variant !== "viewer" ? "-mt-[13px] -mr-[15px]" : ""}`}>
                                                {headerAction}
                                                {!hideDefaultClose && closeButton}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {!titleInBody && (
                                                <Dialog.Title asChild>
                                                    <span className="sr-only">{title}</span>
                                                </Dialog.Title>
                                            )}
                                            {/* Sibling of the scrolling body, not inside it, so it stays put with long content. */}
                                            {!hideDefaultClose && <div className={`absolute z-20 ${variant === "viewer" ? "top-2 right-2 sm:top-0 sm:right-0" : "top-3 right-[5px] sm:top-4 sm:right-[17px]"}`}>{closeButton}</div>}
                                        </>
                                    )}
                                    <div
                                        className={`min-h-0 flex-1 ${variant === "viewer" ? "" : "overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"} ${heading && !flush ? "px-5 pb-5 sm:px-8 sm:pb-7" : ""}`}
                                    >
                                        {children}
                                    </div>
                                    {showFooter && (
                                        <div className="flex-none border-t border-ink/10 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
                                            {discarding ? (
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
                                                    <p className="m-0 text-small text-ink">Discard what you&apos;ve entered?</p>
                                                    <div className="flex gap-3 sm:items-center sm:justify-end">
                                                        <button type="button" autoFocus onClick={() => setDiscarding(false)} className="ui-btn ui-btn-secondary ui-btn-sm flex-1 sm:flex-none">
                                                            Keep editing
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDiscarding(false);
                                                                onClose();
                                                            }}
                                                            className="ui-btn ui-btn-destructive ui-btn-sm flex-1 sm:flex-none"
                                                        >
                                                            Discard
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={MODAL_ACTIONS}>{footer}</div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </Dialog.Content>
                        </div>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
