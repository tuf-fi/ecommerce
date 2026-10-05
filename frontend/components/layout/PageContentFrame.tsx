"use client";

import { usePathname } from "next/navigation";

// Admin never renders PromoBanner, so its `--promo-h`-correcting effect never runs — this opt-out avoids a dead gap on direct load.
export default function PageContentFrame({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith("/admin");

    return (
        <div style={{ paddingTop: isAdmin ? 0 : "var(--promo-h, 0px)" }} className="flex flex-1 flex-col">
            {children}
        </div>
    );
}
