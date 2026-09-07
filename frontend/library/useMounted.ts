"use client";

import { useEffect, useState } from "react";

// True only after the client has taken over from the server-rendered HTML.
// Every page here reads its data from an in-memory mock store (no real
// fetch yet), so this brief false->true flip is the one loading window that
// genuinely exists today — it's also the seam a real API call will hang its
// isLoading state on once the backend lands, replacing this hook there.
export function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
