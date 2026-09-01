"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/library/adminStore";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
    const { isAdminLoggedIn, authChecked } = useAdminStore();
    const router = useRouter();

    useEffect(() => {
        if (authChecked && !isAdminLoggedIn) router.replace("/admin/login");
    }, [authChecked, isAdminLoggedIn, router]);

    if (!authChecked || !isAdminLoggedIn) {
        return <div className="flex min-h-screen items-center justify-center bg-white text-[13px] text-grey">Loading…</div>;
    }

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] bg-white">
            <AdminSidebar />
            <div className="ml-60 min-h-screen">
                <AdminTopbar />
                <div className="px-10 pt-7 pb-16">{children}</div>
            </div>
        </div>
    );
}
