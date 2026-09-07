"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

// Every submit/click handler in this app is currently a synchronous mock
// (TODO-marked for a real API call later) — this simulates the network
// latency that call will have, so the loading state this hook drives is
// actually visible instead of flashing for 0ms.
// TODO: this fixed delay is a demo-only stand-in for real network latency —
// remove it (or replace with whatever the real request naturally takes) once
// these actions call the actual backend API.
export const SIMULATED_LATENCY_MS = 700;
export const wait = (ms: number = SIMULATED_LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

// Wraps a submit handler with a `loading` flag so callers can disable their
// button and swap its label while the (simulated, for now) request is in
// flight, instead of resolving/closing instantly. Callers are expected to
// pass `loading` back to the button's `disabled` prop, which is what
// actually prevents a double-submit while one call is in flight.
export function useAsyncAction<Args extends unknown[]>(action: (...args: Args) => Promise<void> | void) {
    const [loading, setLoading] = useState(false);
    const run = useCallback(
        async (...args: Args) => {
            setLoading(true);
            try {
                await action(...args);
            } catch {
                // Once these become real API calls, a rejection would otherwise
                // silently re-enable the button with no signal the save failed.
                toast.error("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        },
        [action]
    );
    return [loading, run] as const;
}
