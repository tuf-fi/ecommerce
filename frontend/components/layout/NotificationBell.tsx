"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Tooltip from "@/components/ui/Tooltip";
import { useStore } from "@/library/store";
import type { CustomerNotification } from "@/library/api/customer";
import { NotificationIcon, notificationTime } from "@/components/account/notificationUi";

const PREVIEW = 6;

export default function NotificationBell() {
    const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead, soundEnabled, setSoundEnabled } = useStore();
    const router = useRouter();
    const [open, setOpen] = useState(false);
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

    function go(n: CustomerNotification) {
        markNotificationRead(n.id);
        setOpen(false);
        if (n.href) router.push(n.href);
    }

    return (
        <div ref={ref} className="relative max-sm:static">
            <Tooltip label="Notifications" disabled={open}>
                <button
                    aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
                    aria-haspopup="true"
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                    className="relative flex h-10 w-10 items-center justify-center text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                    </svg>
                    {unreadNotifications > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-pink-btn px-0.5 text-[9px] font-semibold">
                            {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </span>
                    )}
                </button>
            </Tooltip>

            {open && (
                <div className="absolute top-full right-[var(--gutter)] z-70 mt-2 w-[min(340px,calc(100vw-2*var(--gutter)))] overflow-hidden sm:right-0 border border-ink/10 bg-white text-ink shadow-modal">
                    <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                        <span className="font-display text-[13.5px] font-medium">Notifications</span>
                        <div className="flex items-center gap-3">
                            {unreadNotifications > 0 && (
                                <button onClick={markAllNotificationsRead} className="text-[11px] font-medium text-pink-dark transition hover:text-pink-btn">
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                aria-label={soundEnabled ? "Mute notification sound" : "Unmute notification sound"}
                                aria-pressed={!soundEnabled}
                                title={soundEnabled ? "Mute sound" : "Unmute sound"}
                                className="flex h-7 w-7 items-center justify-center text-grey transition hover:bg-ink/5 hover:text-ink"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                                {soundEnabled ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6M21 9l-5 6" />}
                            </svg>
                            </button>
                        </div>
                    </div>
                    <div className="thin-scrollbar max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="px-4 py-8 text-center text-[12.5px] text-grey">Nothing yet. Order updates and new codes show up here.</p>
                        ) : (
                            notifications.slice(0, PREVIEW).map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => go(n)}
                                    className={`flex w-full gap-3 border-b border-ink/10 px-4 py-3 text-left transition last:border-b-0 hover:bg-ink/5 ${n.read ? "" : "bg-blue-soft/40"}`}
                                >
                                    <NotificationIcon type={n.type} className="mt-0.5 flex-none text-grey" />
                                    <span className="min-w-0 flex-1">
                                        <span className={`block text-[12.5px] leading-snug ${n.read ? "text-ink/75" : "font-medium text-ink"}`}>{n.title}</span>
                                        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-grey">{n.body}</span>
                                        <span className="mt-1 block font-mono text-[10px] text-grey">{notificationTime(n.createdAt)}</span>
                                    </span>
                                    {!n.read && <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-pink-btn" />}
                                </button>
                            ))
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setOpen(false);
                            router.push("/account/notifications");
                        }}
                        className="block w-full border-t border-ink/10 px-4 py-3 text-center text-[12px] font-medium text-ink/80 transition hover:bg-ink/5 hover:text-ink"
                    >
                        View all
                    </button>
                </div>
            )}
        </div>
    );
}
