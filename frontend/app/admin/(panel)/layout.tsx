"use client";

import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED, useAdminStore } from "@/library/adminStore";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { FULL_BLEED } from "@/components/admin/formClasses";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed } = useAdminStore();

    return (
        <AdminAuthGate>
            <div className={`${FULL_BLEED} bg-white`}>
                <AdminSidebar />
                <div
                    className="min-h-screen transition-[margin] duration-200 ease-in-out will-change-[margin] lg:[margin-left:var(--sidebar-w)]"
                    style={
                        {
                            "--sidebar-w": `${sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}px`,
                        } as React.CSSProperties
                    }
                >
                    <AdminTopbar />
                    <div className="px-5 pt-6 pb-12 sm:px-10 sm:pt-7 sm:pb-16">{children}</div>
                </div>
            </div>
        </AdminAuthGate>
    );
}
