"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/components/ui/motion/constants";
import { useStore } from "@/library/store";
import type { CustomerNotification } from "@/library/api/customer";
import { NotificationIcon } from "@/components/account/notificationUi";

const VISIBLE_MS = 5000;
const FADE_S = 1.5;

function Popup({ n }: { n: CustomerNotification }) {
    const { dismissLiveNotification, markNotificationRead } = useStore();
    const router = useRouter();
    const [fading, setFading] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setFading(true), VISIBLE_MS);
        return () => clearTimeout(t);
    }, []);

    function open() {
        markNotificationRead(n.id);
        dismissLiveNotification(n.id);
        if (n.href) router.push(n.href);
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: fading ? 0 : 1, x: 0 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
            transition={fading ? { opacity: { duration: FADE_S, ease: "linear" } } : { duration: 0.4, ease: EASE }}
            onAnimationComplete={() => fading && dismissLiveNotification(n.id)}
            role="status"
            className="pointer-events-auto relative w-[min(360px,calc(100vw-2rem))] border border-ink/10 bg-white shadow-modal"
        >
            <button onClick={open} className="flex w-full gap-3 py-4 pr-11 pl-4 text-left transition hover:bg-off/60">
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-ink/10 text-ink">
                    <NotificationIcon type={n.type} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-snug font-semibold text-ink">{n.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-grey">{n.body}</span>
                </span>
            </button>
            <button
                onClick={() => dismissLiveNotification(n.id)}
                aria-label="Dismiss notification"
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center text-grey transition hover:bg-off hover:text-ink focus-visible:ring-2 focus-visible:ring-navy"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>
        </motion.div>
    );
}

export default function NotificationToaster() {
    const { liveNotifications } = useStore();

    return (
        <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[90] flex flex-col items-end gap-3">
            <AnimatePresence initial={false}>
                {liveNotifications.map((n) => (
                    <Popup key={n.id} n={n} />
                ))}
            </AnimatePresence>
        </div>
    );
}
