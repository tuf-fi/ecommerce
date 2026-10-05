"use client";

import Link from "next/link";
import { isAdministrator } from "@/library/admin/permissions";
import { usePathname } from "next/navigation";
import {
    SIDEBAR_WIDTH_COLLAPSED,
    SIDEBAR_WIDTH_EXPANDED,
    SETTINGS_NAV_WIDTH,
    ADMIN_TOPBAR_HEIGHT,
    useAdminStore,
} from "@/library/adminStore";

type NavItem = { href: string; label: string; icon: React.ReactNode; adminOnly?: boolean };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
    {
        label: "Security",
        items: [
            {
                href: "/admin/settings",
                label: "Password & Authentication",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="4" y="11" width="16" height="9" rx="1.5" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                ),
            },
            {
                href: "/admin/settings/sessions",
                label: "Active Sessions",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="4" width="18" height="12" rx="1.5" />
                        <path d="M8 20h8M12 16v4" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Store",
        items: [
            {
                href: "/admin/settings/payments",
                label: "Payment Details",
                adminOnly: true,
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="6" width="18" height="12" rx="1.5" />
                        <path d="M3 10h18M7 15h3" />
                    </svg>
                ),
            },
        ],
    },
];

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { sidebarCollapsed, currentStaffMember } = useAdminStore();
    const sidebarLeft = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
    // Links to pages this account can't use aren't shown.
    const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.adminOnly || isAdministrator(currentStaffMember)) })).filter((g) => g.items.length > 0);
    const allItems = groups.flatMap((g) => g.items);

    return (
        // Cancels the ancestor's responsive pt/px so this section can run flush to the true edges.
        <div className="-mt-6 -mx-5 sm:-mt-7 sm:-mx-10">
            <nav className="flex gap-1 overflow-x-auto border-b border-ink/10 bg-white px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
                {allItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-none items-center gap-2 px-3 py-2 text-[12.5px] whitespace-nowrap transition ${
                                active ? "bg-off font-semibold text-ink" : "text-grey hover:bg-off/70 hover:text-ink"
                            }`}
                        >
                            <span className={active ? "text-ink" : "text-grey"}>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <aside
                className="thin-scrollbar fixed z-10 hidden overflow-y-auto border-r border-ink/10 bg-white transition-[left] duration-200 ease-in-out lg:block"
                style={{ left: sidebarLeft, top: ADMIN_TOPBAR_HEIGHT, bottom: 0, width: SETTINGS_NAV_WIDTH }}
            >
                <nav className="flex flex-col gap-5 p-7">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <div className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-[.16em] text-grey">
                                {group.label}
                            </div>
                            <div className="flex flex-col gap-px">
                                {group.items.map((item) => {
                                    const active = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] transition ${
                                                active ? "bg-off font-semibold text-ink" : "text-grey hover:bg-off/70 hover:text-ink"
                                            }`}
                                        >
                                            <span className={active ? "text-ink" : "text-grey"}>{item.icon}</span>
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* lg:ml must match SETTINGS_NAV_WIDTH (adminStore.tsx) — Tailwind can't read the constant directly. */}
            <div className="min-w-0 pt-6 pr-5 pb-10 pl-5 sm:pr-10 sm:pb-10 sm:pl-10 lg:ml-[264px]">
                {children}
            </div>
        </div>
    );
}
