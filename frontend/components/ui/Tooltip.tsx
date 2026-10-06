"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Side = "bottom" | "right" | "left";

// Chromium fires a synthetic mouseenter on window refocus with no real pointer movement; gate opening on real motion since last blur to avoid phantom tooltips on tab-back.
let mouseHasMoved = false;
if (typeof window !== "undefined") {
    window.addEventListener("mousemove", () => (mouseHasMoved = true), { passive: true });
    window.addEventListener("blur", () => (mouseHasMoved = false));
}

// Portaled to <body> instead of CSS-positioned: a scrolling ancestor's overflow-y-auto forces overflow-x:auto too, clipping a tooltip escaping sideways.
export default function Tooltip({
    label,
    children,
    side = "bottom",
    disabled = false,
}: {
    label: string;
    children: React.ReactNode;
    side?: Side;
    disabled?: boolean;
}) {
    const triggerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left?: number; right?: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    useEffect(() => {
        if (!open) {
            setVisible(false);
            return;
        }
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setCoords(
            side === "right"
                ? { top: rect.top + rect.height / 2, left: rect.right + 8 }
                : side === "left"
                  ? { top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + 8 }
                  : { top: rect.bottom + 8, left: rect.left + rect.width / 2 }
        );
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, [open, side]);

    return (
        <div
            ref={triggerRef}
            className="relative inline-flex"
            // Mouse and keyboard only: a tap focuses the button and fires emulated mouse events, which left the tooltip stuck on touch screens.
            onPointerEnter={(e) => !disabled && e.pointerType === "mouse" && mouseHasMoved && setOpen(true)}
            onPointerLeave={() => setOpen(false)}
            onPointerDown={(e) => e.pointerType !== "mouse" && setOpen(false)}
            onFocus={(e) => !disabled && e.target.matches(":focus-visible") && setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            {children}
            {open &&
                createPortal(
                    <span
                        role="tooltip"
                        style={{ top: coords.top, left: coords.left, right: coords.right }}
                        className={`pointer-events-none fixed z-[70] rounded-[3px] border border-white/10 bg-ink px-3 py-1.5 font-mono text-[10px] tracking-[.08em] whitespace-nowrap text-white uppercase shadow-tooltip transition-[transform,opacity] duration-150 ease-out ${
                            side === "right"
                                ? `-translate-y-1/2 ${visible ? "translate-x-0 scale-100 opacity-100" : "-translate-x-1 scale-95 opacity-0"}`
                                : side === "left"
                                  ? `-translate-y-1/2 ${visible ? "translate-x-0 scale-100 opacity-100" : "translate-x-1 scale-95 opacity-0"}`
                                  : `-translate-x-1/2 ${visible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1 scale-95 opacity-0"}`
                        }`}
                    >
                        {label}
                        <span
                            aria-hidden="true"
                            className={`absolute h-1.5 w-1.5 rotate-45 border-white/10 bg-ink ${
                                side === "right"
                                    ? "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 border-b border-l"
                                    : side === "left"
                                      ? "top-1/2 right-0 translate-x-1/2 -translate-y-1/2 border-t border-r"
                                      : "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t border-l"
                            }`}
                        />
                    </span>,
                    document.body
                )}
        </div>
    );
}
