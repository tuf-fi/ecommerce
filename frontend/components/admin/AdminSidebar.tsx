"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAdminStore } from "@/library/adminStore";
import { EASE } from "@/components/ui/motion/constants";
import Tooltip from "@/components/ui/Tooltip";
import { AdminSection, canAccessSection } from "@/library/admin/permissions";

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
        >
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

const NAV_GROUPS: { label: string; items: { href: string; label: string; section: AdminSection; icon: React.ReactNode }[] }[] = [
    {
        label: "Overview",
        items: [
            {
                href: "/admin/dashboard",
                label: "Dashboard",
                section: "dashboard",
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
                section: "inventory",
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
                section: "inventory",
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
                section: "orders",
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
                section: "staff",
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
                section: "content",
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
                section: "settings",
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
    const { adminName, currentStaffMember, sidebarCollapsed, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useAdminStore();

    // Cosmetic-only filtering (see library/admin/permissions.ts); a group with nothing visible is dropped entirely.
    const visibleGroups = NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessSection(currentStaffMember, item.section)),
    })).filter((group) => group.items.length > 0);

    useEffect(() => { closeMobileSidebar(); }, [pathname, closeMobileSidebar]);
    useEffect(() => {
        document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileSidebarOpen]);
    useEffect(() => {
        if (!mobileSidebarOpen) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") closeMobileSidebar();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [mobileSidebarOpen, closeMobileSidebar]);

    const allHrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    const activeHref = allHrefs
        .filter((href) => pathname === href || pathname.startsWith(href + "/"))
        .sort((a, b) => b.length - a.length)[0];

    return (
        <>
            {/* Backdrop — mobile drawer only; the desktop sidebar never dims the page. */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <motion.button
                        aria-label="Close menu"
                        onClick={closeMobileSidebar}
                        className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: EASE }}
                    />
                )}
            </AnimatePresence>

            {/* The collapse animates `width` (not transform): collapsing genuinely
                changes the sidebar's own content layout (labels hide, icons
                center) and, via the content wrapper's matching margin transition
                in (panel)/layout.tsx, resizes the main content area to use the
                freed space — an effect transform alone can't produce since it
                only repositions a layer without changing anything's box size.
                `will-change` hints the browser to isolate the repaint cost. */}
            <aside
                className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col overflow-hidden bg-navy px-4.5 py-6.5 text-white transition-transform duration-300 ease-in-out will-change-[width] lg:z-30 lg:w-60 lg:transition-[width,transform] lg:duration-200 ${
                    mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0 ${sidebarCollapsed ? "lg:w-[68px]" : "lg:w-60"}`}
            >
                {/* Mobile-only close button */}
                <button
                    onClick={closeMobileSidebar}
                    aria-label="Close menu"
                    className="absolute top-3 right-0 flex h-11 w-11 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                </button>

                {/* Logo + desktop collapse toggle share one flex header: a row when
                    expanded (toggle at the trailing edge), a centered column when
                    collapsed (toggle beneath the mark) — no absolute offsets to
                    fall out of sync with the rail width. */}
                <div className={`mb-8 flex gap-3 ${sidebarCollapsed ? "lg:flex-col lg:items-center" : "items-start justify-between"}`}>
                    <div className="min-w-0">
                        <div className={`font-display text-[19px] font-medium tracking-wide whitespace-nowrap ${sidebarCollapsed ? "lg:text-center" : ""}`}>
                            <span className={sidebarCollapsed ? "hidden lg:inline" : "hidden"}>C</span>
                            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Cindyrella</span>
                        </div>
                        <div className={`mt-1 font-mono text-[10px] tracking-[.08em] text-grey-light uppercase ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                            Admin Panel
                        </div>
                    </div>

                    {/* Desktop-only collapse toggle */}
                    <button
                        onClick={toggleSidebar}
                        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white lg:flex"
                    >
                        <CollapseIcon collapsed={sidebarCollapsed} />
                    </button>
                </div>

                <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {visibleGroups.map((group, i) => (
                        <div key={group.label} className={`mt-5 first:mt-0 ${sidebarCollapsed ? "lg:mt-3 lg:first:mt-0" : ""}`}>
                            <div className={`mb-1 px-3 font-mono text-[11px] tracking-[.14em] text-white/35 uppercase ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                                {group.label}
                            </div>
                            {sidebarCollapsed && i > 0 && (
                                <div className="mx-3 mb-3 hidden border-t border-white/10 lg:block" aria-hidden="true" />
                            )}
                            <div className={`flex flex-col gap-0.5 ${sidebarCollapsed ? "lg:gap-1" : ""}`}>
                                {group.items.map((item) => {
                                    const active = item.href === activeHref;
                                    const link = (
                                        <Link
                                            href={item.href}
                                            aria-label={item.label}
                                            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] whitespace-nowrap transition ${
                                                sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
                                            } ${
                                                active ? "bg-white font-medium text-navy" : "text-white/75 hover:bg-white/10 hover:text-white"
                                            }`}
                                        >
                                            <span className={active ? "opacity-100" : "opacity-75"}>{item.icon}</span>
                                            <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                                        </Link>
                                    );
                                    return sidebarCollapsed ? (
                                        <Tooltip key={item.href} label={item.label} side="right">
                                            {link}
                                        </Tooltip>
                                    ) : (
                                        <div key={item.href}>{link}</div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className={`mt-4 border-t border-white/15 pt-4 text-[12px] whitespace-nowrap text-grey-light ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                    <b className="block text-[13px] font-medium text-white">{adminName || "Admin"}</b>
                    {currentStaffMember?.role ?? "Administrator"}
                </div>
            </aside>
        </>
    );
}
