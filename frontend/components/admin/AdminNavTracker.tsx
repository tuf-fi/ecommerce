"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { recordAdminPath } from "@/library/adminHistory";

// Renders nothing; keeps track of the last admin page so a "Back" button can return to it.
export default function AdminNavTracker() {
    const pathname = usePathname();
    const search = useSearchParams().toString();
    useEffect(() => {
        recordAdminPath(search ? `${pathname}?${search}` : pathname);
    }, [pathname, search]);
    return null;
}
