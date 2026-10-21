"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

const CURRENT = "admin-nav-current";
const PREVIOUS = "admin-nav-previous";

function read(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

// Called on every admin page change: what was current becomes "previous".
export function recordAdminPath(url: string) {
    try {
        const current = read(CURRENT);
        if (current === url) return;
        if (current) sessionStorage.setItem(PREVIOUS, current);
        sessionStorage.setItem(CURRENT, url);
    } catch {
        // Storage can be blocked; Back then just uses its fallback.
    }
}

// "Back" for admin screens: returns to the admin page you came from, and only uses `fallback` when there isn't one
// (opened directly, or from outside the admin).
export function useAdminBack(fallback: string) {
    const router = useRouter();
    return useCallback(() => {
        const previous = read(PREVIOUS);
        const here = read(CURRENT);
        const usable = previous && previous !== here && previous.startsWith("/admin") && !previous.startsWith("/admin/login");
        router.push(usable ? previous : fallback);
    }, [router, fallback]);
}
