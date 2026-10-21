"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAdminStore } from "@/library/adminStore";
import Tooltip from "@/components/ui/Tooltip";
import { canManageStaff } from "@/library/admin/permissions";
import { ADMIN_LOGIN_PATH } from "@/library/adminPaths";

const TITLES: Record<string, string> = {
    dashboard: "Dashboard",
    inventory: "Inventory",
    orders: "Orders",
    staff: "Staff & Roles",
    content: "Content",
    settings: "Settings",
    payments: "Payment Details",
    subscribers: "Newsletter Subscribers",
    messages: "Contact Messages",
};

// The Content screen is tabbed; the breadcrumb names the tab you are on.
const CONTENT_TABS: Record<string, string> = {
    pages: "Pages",
    collections: "Content Collections",
    blog: "Blog",
    promotions: "Promotions",
    links: "Links",
    contact: "Contact Information",
};

function humanize(segment: string) {
    if (segment === "new") return "New";
    return segment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function useAdminTitle() {
    const pathname = usePathname();
    const tab = useSearchParams().get("tab") ?? "pages";
    const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
    const first = segments[0] ?? "dashboard";

    if (first === "inventory" && segments[1] === "movements") {
        return { title: "Stock Movements", path: "Admin / Stock Movements" };
    }

    const title = TITLES[first] ?? humanize(first);
    const rest = first === "content" && segments.length === 1 ? [CONTENT_TABS[tab] ?? humanize(tab)] : segments.slice(1).map(humanize);
    const path = ["Admin", title, ...rest].join(" / ");
    return { title, path };
}

function initials(name: string) {
    if (!name) return "A";
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function AdminTopbar() {
    const { title, path } = useAdminTitle();
    const { adminName, currentStaffMember, logout, notifications, markNotificationRead, markAllNotificationsRead, openMobileSidebar } = useAdminStore();
    const router = useRouter();
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Escape closes whichever dropdown is open.
    useEffect(() => {
        if (!notifOpen && !profileOpen) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setNotifOpen(false);
                setProfileOpen(false);
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [notifOpen, profileOpen]);

    function handleNotificationClick(n: (typeof notifications)[number]) {
        markNotificationRead(n.id);
        setNotifOpen(false);
        if (n.type === "order" && n.ref) router.push(`/admin/orders?order=${n.ref}`);
        else if (n.type === "inventory") router.push("/admin/inventory");
        else if (n.type === "staff") router.push("/admin/staff");
    }

    function handleLogout() {
        setProfileOpen(false);
        logout();
        router.push(ADMIN_LOGIN_PATH);
    }

    return (
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-ink/10 bg-white px-5 py-5.5 sm:px-10">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    onClick={openMobileSidebar}
                    aria-label="Open menu"
                    className="flex h-9 w-9 flex-none items-center justify-center text-ink/75 transition hover:bg-off lg:hidden"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 6h18M3 12h18M3 18h18" />
                    </svg>
                </button>
                <div className="min-w-0">
                    <h1 className="m-0 truncate font-display text-subhead font-normal text-ink">{title}</h1>
                    <div className="mt-0.5 truncate font-mono text-label text-grey">{path}</div>
                </div>
            </div>

            <div className="flex flex-none items-center gap-4.5">
                <div className="relative" ref={notifRef}>
                    <Tooltip label="Notifications" disabled={notifOpen}>
                        <button
                            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                            aria-haspopup="true"
                            aria-expanded={notifOpen}
                            onClick={() => {
                                setNotifOpen((o) => !o);
                                setProfileOpen(false);
                            }}
                            className="relative flex h-9 w-9 items-center justify-center text-ink/75 transition hover:bg-off"
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert px-1 font-mono text-label font-semibold text-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>
                    </Tooltip>

                    {notifOpen && (
                        <div className="absolute top-[calc(100%+14px)] right-0 z-70 min-w-[300px] overflow-hidden border border-ink/10 bg-white shadow-modal">
                            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3.5 font-display text-small font-medium">
                                Notifications
                                {unreadCount > 0 && (
                                    <button onClick={markAllNotificationsRead} className="font-body text-label font-medium text-pink hover:text-pink-dark">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="thin-scrollbar max-h-80 overflow-y-auto">
                                {notifications.length === 0 && (
                                    <div className="p-6 text-center text-meta text-grey">No notifications yet.</div>
                                )}
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`block w-full border-b border-ink/10 px-4 py-3 text-left transition last:border-b-0 hover:bg-off ${
                                            !n.read ? "bg-blue-soft" : ""
                                        }`}
                                    >
                                        <div className="mb-1 text-meta leading-snug text-ink">{n.text}</div>
                                        <div className="font-mono text-label text-grey">{n.time}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={profileRef}>
                    <button
                        aria-haspopup="true"
                        aria-expanded={profileOpen}
                        onClick={() => {
                            setProfileOpen((o) => !o);
                            setNotifOpen(false);
                        }}
                        className="flex items-center gap-2.5"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-display text-small text-white">
                            {initials(adminName)}
                        </span>
                        <span className="hidden text-left sm:block">
                            <span className="block text-meta font-semibold text-ink">{adminName || "Admin"}</span>
                            <span className="block font-mono text-label tracking-[.04em] text-grey uppercase">{currentStaffMember?.role ?? "Administrator"}</span>
                        </span>
                    </button>

                    {profileOpen && (
                        <div className="absolute top-[calc(100%+14px)] right-0 z-70 min-w-[230px] overflow-hidden border border-ink/10 bg-white shadow-modal">
                            <button
                                onClick={() => {
                                    setProfileOpen(false);
                                    router.push("/admin/settings");
                                }}
                                className="block w-full px-4 py-3 text-left text-small text-ink transition hover:bg-off"
                            >
                                Account Settings
                            </button>
                            {canManageStaff(currentStaffMember) && (
                                <button
                                    onClick={() => {
                                        setProfileOpen(false);
                                        router.push("/admin/staff");
                                    }}
                                    className="block w-full px-4 py-3 text-left text-small text-ink transition hover:bg-off"
                                >
                                    Staff & Roles
                                </button>
                            )}
                            <div className="h-px bg-ink/10" />
                            <button onClick={handleLogout} className="block w-full px-4 py-3 text-left text-small text-alert transition hover:bg-off">
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
