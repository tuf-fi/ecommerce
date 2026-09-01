"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminStore } from "@/library/adminStore";

const NAV_GROUPS = [
    {
        label: "Overview",
        items: [
            {
                href: "/admin/dashboard",
                label: "Dashboard",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Catalog",
        items: [
            {
                href: "/admin/inventory",
                label: "Inventory",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M21 8V21H3V8" />
                        <path d="M1 3h22v5H1z" />
                        <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                ),
            },
            {
                href: "/admin/inventory/movements",
                label: "Stock Movements",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="5" y="3" width="14" height="18" rx="1.5" />
                        <path d="M9 3v2h6V3" />
                        <line x1="8" y1="10" x2="16" y2="10" />
                        <line x1="8" y1="14" x2="16" y2="14" />
                        <line x1="8" y1="18" x2="13" y2="18" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Sales",
        items: [
            {
                href: "/admin/orders",
                label: "Orders",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M6 2l1.5 4h9L18 2" />
                        <path d="M3.5 6h17l-1.6 13.5a2 2 0 0 1-2 1.5H7.1a2 2 0 0 1-2-1.5L3.5 6z" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Management",
        items: [
            {
                href: "/admin/staff",
                label: "Staff & Roles",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                ),
            },
            {
                href: "/admin/content",
                label: "Content",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="7" y1="14" x2="14" y2="14" />
                        <line x1="7" y1="17" x2="11" y2="17" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "System",
        items: [
            {
                href: "/admin/settings",
                label: "Settings",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                    </svg>
                ),
            },
        ],
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { adminName } = useAdminStore();

    return (
        <aside className="fixed top-0 bottom-0 left-0 z-30 flex w-60 flex-col bg-navy px-4.5 py-6.5 text-white">
            <div className="mb-1 font-display text-[19px] font-medium tracking-wide">Cindyrella</div>
            <div className="mb-8 font-mono text-[10px] tracking-[.08em] text-grey-light uppercase">Admin Panel</div>

            <nav className="scrollbar-hairline flex min-h-0 flex-1 flex-col overflow-y-auto">
                {(() => {
                    const allHrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
                    const activeHref = allHrefs
                        .filter((href) => pathname === href || pathname.startsWith(href + "/"))
                        .sort((a, b) => b.length - a.length)[0];

                    return NAV_GROUPS.map((group) => (
                        <div key={group.label} className="mt-5 first:mt-0">
                            <div className="mb-1 px-3 font-mono text-[10px] tracking-[.14em] text-white/35 uppercase">
                                {group.label}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {group.items.map((item) => {
                                    const active = item.href === activeHref;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition ${
                                                active ? "bg-white font-medium text-navy" : "text-white/75 hover:bg-white/10 hover:text-white"
                                            }`}
                                        >
                                            <span className={active ? "opacity-100" : "opacity-75"}>{item.icon}</span>
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ));
                })()}
            </nav>

            <div className="mt-4 border-t border-white/15 pt-4 text-[12px] text-grey-light">
                <b className="block text-[13px] font-medium text-white">{adminName || "Admin"}</b>
                Administrator
            </div>
        </aside>
    );
}
