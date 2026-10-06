"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useStore } from "@/library/store";
import { ApiError } from "@/library/api/client";
import { sendTestNotification } from "@/library/api/customer";

// Developer helper: never rendered in a production build unless NEXT_PUBLIC_APP_ENV is "staging".
const ENABLED = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_APP_ENV === "staging";

export default function DevToolsFab() {
    const { isLoggedIn } = useStore();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    if (!ENABLED || pathname.startsWith("/admin")) return null;

    async function test() {
        setSending(true);
        try {
            await sendTestNotification();
            setOpen(false);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Could not reach the server.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div ref={ref} className="fixed bottom-4 left-4 z-[90]">
            {open && (
                <div className="absolute bottom-[calc(100%+10px)] left-0 w-52 border border-ink/10 bg-white py-1.5 shadow-modal">
                    <div className="px-4 pt-2 pb-1.5 font-mono text-[10px] tracking-[.14em] text-grey uppercase">Developer tools</div>
                    <button
                        onClick={test}
                        disabled={!isLoggedIn || sending}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] text-ink transition hover:bg-off disabled:cursor-not-allowed disabled:text-grey disabled:hover:bg-transparent"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-none">
                            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                        </svg>
                        {sending ? "Sending…" : "Test Notification"}
                    </button>
                    {!isLoggedIn && <p className="px-4 pb-2 text-[11px] text-grey">Sign in as a customer to use this.</p>}
                </div>
            )}
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Developer tools"
                aria-haspopup="true"
                aria-expanded={open}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-modal transition hover:bg-pink-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
                    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z" />
                </svg>
            </button>
        </div>
    );
}
