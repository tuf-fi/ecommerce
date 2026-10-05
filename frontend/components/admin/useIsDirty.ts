"use client";

import { useState } from "react";

// Shallow reference comparison against the mount-time snapshot; safe since every setter here creates a new value rather than mutating.
export function useIsDirty<T extends Record<string, unknown>>(current: T): boolean {
    const [initial] = useState(current);
    return (Object.keys(current) as (keyof T)[]).some((k) => current[k] !== initial[k]);
}
