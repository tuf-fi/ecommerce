"use client";

import { useEffect, useState } from "react";

// True only after client hydration — the one real loading window today, and the seam a future API call's isLoading will hang on.
export function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
