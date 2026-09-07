"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED, useAdminStore } from "@/library/adminStore";

const NAV_GROUPS = [
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
        label: "Notifications",
        items: [
            {
                href: "/admin/settings/notifications",
                label: "Notification Preferences",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                    </svg>
                ),
            },
        ],
    },
];

// Position math (viewport-relative, since the nav is `fixed`, not `sticky`):
// AdminSidebar sits at SIDEBAR_LEFT (its current width, expanded or
// collapsed) — the nav sits flush against it, no gap. 86px down clears
// AdminTopbar's rendered height (py-5.5 padding + its two text lines) so the
// nav — and the content column — start flush under it.
const NAV_WIDTH = 264;
const TOPBAR_HEIGHT = 86;

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { sidebarCollapsed } = useAdminStore();
    const sidebarLeft = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
    const allItems = NAV_GROUPS.flatMap((g) => g.items);

    return (
        // Cancels the ancestor's responsive `pt/px` entirely — this section owns
        // its own flush layout: the nav sits directly against AdminSidebar and
        // under AdminTopbar with no gap, content runs to the true right edge
        // of the screen, and the `border-r` below (not a blank margin) is
        // what marks the boundary between nav and content. Below `lg` there's
        // no room for a fixed side nav next to content, so it collapses into
        // a horizontal scrolling tab strip instead.
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
                style={{ left: sidebarLeft, top: TOPBAR_HEIGHT, bottom: 0, width: NAV_WIDTH }}
            >
                <nav className="flex flex-col gap-5 p-7">
                    {NAV_GROUPS.map((group) => (
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

            {/* lg:ml matches NAV_WIDTH (264px) — only applied at the breakpoint where the fixed aside above is visible. */}
            <div className="min-w-0 pt-6 pr-5 pb-10 pl-5 sm:pr-10 sm:pb-10 sm:pl-10 lg:ml-[264px]">
                {children}
            </div>
        </div>
    );
}
