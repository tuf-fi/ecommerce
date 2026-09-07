"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScaleLoader } from "react-spinners";
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED, useAdminStore } from "@/library/adminStore";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
    const { isAdminLoggedIn, authChecked, sidebarCollapsed } = useAdminStore();
    const router = useRouter();

    useEffect(() => {
        if (authChecked && !isAdminLoggedIn) router.replace("/admin/login");
    }, [authChecked, isAdminLoggedIn, router]);

    if (!authChecked || !isAdminLoggedIn) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col justify-between bg-navy px-6 py-10 text-white sm:px-16 sm:py-14">
                <div className="font-display text-[20px] font-medium tracking-wide">Cindyrella</div>

                <div className="max-w-[380px]">
                    <div className="mb-6 flex items-center gap-x-4 uppercase">
                        <span className="font-mono text-[10.5px] text-grey-light">00</span>
                        <span className="font-mono text-[10.5px] tracking-[.16em] text-white/70">Admin Access</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
                    </div>
                    <h1 className="mb-6 font-display text-[36px] leading-[1.05] font-normal text-white">
                        Checking your session.
                    </h1>
                    <div className="flex items-center gap-3">
                        <ScaleLoader color="#DA6E93" height={12} width={2} radius={1} margin={2} speedMultiplier={0.85} />
                        <span className="font-mono text-[10.5px] tracking-[.14em] text-grey-light uppercase">Verifying credentials</span>
                    </div>
                </div>

                <div className="font-mono text-[10px] tracking-[.14em] text-white/35 uppercase">Restricted — Staff Only</div>
            </div>
        );
    }

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] bg-white">
            <AdminSidebar />
            <div
                className="min-h-screen transition-[margin] duration-200 ease-in-out lg:[margin-left:var(--sidebar-w)]"
                style={{ "--sidebar-w": `${sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}px` } as React.CSSProperties}
            >
                <AdminTopbar />
                <div className="px-5 pt-6 pb-12 sm:px-10 sm:pt-7 sm:pb-16">{children}</div>
            </div>
        </div>
    );
}
