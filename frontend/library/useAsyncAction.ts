"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

// TODO: demo-only stand-in for real network latency — remove once these actions call the real API; keeps loading state visible instead of flashing for 0ms.
export const SIMULATED_LATENCY_MS = 700;
export const wait = (ms: number = SIMULATED_LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

// Drives a `loading` flag callers pass to their button's `disabled` prop, which is what actually prevents a double-submit.
export function useAsyncAction<Args extends unknown[]>(action: (...args: Args) => Promise<void> | void) {
    const [loading, setLoading] = useState(false);
    const run = useCallback(
        async (...args: Args) => {
            setLoading(true);
            try {
                await action(...args);
            } catch {
                // Surfaces failure once real API calls can reject, instead of silently re-enabling the button.
                toast.error("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        },
        [action]
    );
    return [loading, run] as const;
}
