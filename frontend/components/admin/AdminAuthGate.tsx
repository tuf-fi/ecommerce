"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScaleLoader } from "react-spinners";
import { useAdminStore } from "@/library/adminStore";
import { canAccessSection, sectionForPath } from "@/library/admin/permissions";

// Shared by every admin layout (chrome and chrome-less) so the redirect + "checking session" loader stays identical everywhere.
export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
    const { isAdminLoggedIn, authChecked, currentStaffMember } = useAdminStore();
    const router = useRouter();
    const pathname = usePathname();

    // Pages the signed-in account can't use (typed in, bookmarked, or an old link) go back to the dashboard.
    const section = sectionForPath(pathname);
    const allowed = section === null || canAccessSection(currentStaffMember, section);

    useEffect(() => {
        if (authChecked && !isAdminLoggedIn) router.replace("/admin/login");
        else if (authChecked && isAdminLoggedIn && !allowed) {
            toast.error("Your account doesn't have access to that page.");
            router.replace("/admin/dashboard");
        }
    }, [authChecked, isAdminLoggedIn, allowed, router]);

    if (!authChecked || !isAdminLoggedIn || !allowed) {
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

    return <>{children}</>;
}
