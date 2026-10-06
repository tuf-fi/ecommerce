"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeading from "@/components/ui/PageHeading";
import Toggle from "@/components/ui/Toggle";
import Pagination from "@/components/ui/Pagination";
import { useStore } from "@/library/store";
import { CustomerNotification, listMyNotifications } from "@/library/api/customer";
import { NotificationIcon, notificationTime } from "@/components/account/notificationUi";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
    const { unreadNotifications, notificationVersion, markNotificationRead, markAllNotificationsRead, soundEnabled, setSoundEnabled } = useStore();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<CustomerNotification[] | null>(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        let alive = true;
        listMyNotifications({ page, pageSize: PAGE_SIZE })
            .then((r) => {
                if (!alive) return;
                setItems(r.notifications);
                setTotal(r.total);
            })
            .catch(() => alive && setItems((cur) => cur ?? []));
        return () => {
            alive = false;
        };
    }, [page, notificationVersion, unreadNotifications]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    function open(n: CustomerNotification) {
        if (!n.read) {
            markNotificationRead(n.id);
            setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
        }
        if (n.href) router.push(n.href);
    }

    function readAll() {
        markAllNotificationsRead();
        setItems((list) => list?.map((x) => ({ ...x, read: true })) ?? null);
    }

    return (
        <div>
            <PageHeading
                action={
                    unreadNotifications > 0 ? (
                        <button
                            onClick={readAll}
                            className="border border-ink/15 px-5 py-2 text-[12.5px] font-semibold tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                        >
                            Mark all read
                        </button>
                    ) : undefined
                }
            >
                Notifications
            </PageHeading>

            <div className="mb-6 flex items-center justify-between gap-4 border border-ink/10 bg-white px-5 py-4">
                <div>
                    <label htmlFor="notif-sound" className="block text-[13.5px] text-ink">Notification sound</label>
                    <p className="mt-0.5 text-[12px] text-grey">Play a short ding when a new notification arrives, even if this tab is in the background.</p>
                </div>
                <Toggle id="notif-sound" checked={soundEnabled} onChange={setSoundEnabled} ariaLabel="Notification sound" />
            </div>

            {items === null ? null : items.length === 0 ? (
                <p className="py-10 text-[13px] text-grey">Nothing yet. Order updates, account changes and new discount codes will show up here.</p>
            ) : (
                <>
                    <ul className="border border-ink/10 bg-white">
                        {items.map((n) => (
                            <li key={n.id} className="border-b border-ink/10 last:border-b-0">
                                <button
                                    onClick={() => open(n)}
                                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-off/60 ${n.read ? "" : "bg-blue-soft/40"}`}
                                >
                                    <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full border border-ink/10 text-ink">
                                        <NotificationIcon type={n.type} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className={`block text-[13.5px] ${n.read ? "text-ink" : "font-semibold text-ink"}`}>{n.title}</span>
                                        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-grey">{n.body}</span>
                                    </span>
                                    <span className="flex flex-none items-center gap-3 pt-0.5">
                                        <span className="font-mono text-[11px] whitespace-nowrap text-grey">{notificationTime(n.createdAt)}</span>
                                        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${n.read ? "bg-transparent" : "bg-pink-btn"}`} />
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </>
            )}
        </div>
    );
}
