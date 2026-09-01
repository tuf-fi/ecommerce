"use client";

import { usePathname } from "next/navigation";

// Admin routes never render PromoBanner (see ConditionalPromoBanner), so its
// layout effect — the thing that normally corrects `--promo-h` on mount —
// never runs there. Without this early opt-out, a direct load of an admin
// route keeps the SSR-seeded reserved space for a banner that's never shown,
// leaving a dead gap above the admin sidebar/topbar.
export default function PageContentFrame({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith("/admin");

    return (
        <div style={{ paddingTop: isAdmin ? 0 : "var(--promo-h, 0px)" }} className="flex flex-1 flex-col">
            {children}
        </div>
    );
}
