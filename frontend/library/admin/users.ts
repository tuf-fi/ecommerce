import { AdminUser } from "./types";
import type { TrendPoint } from "./dashboard";

// Parsed field-by-field, not via `new Date(iso)`, which reads a bare ISO date as UTC and lands on the wrong local day.
function startOfDay(iso: string): number {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
}

function daysAgo(iso: string): number {
    return Math.round((new Date().setHours(0, 0, 0, 0) - startOfDay(iso)) / (1000 * 60 * 60 * 24));
}

// Bucketed off the real current date (same convention as daysUntilExpiry in products.ts), not the dataset's own latest entry.
export function newUsersInLastDays(users: AdminUser[], days: number): number {
    return users.filter((u) => {
        const age = daysAgo(u.createdAt);
        return age >= 0 && age < days;
    }).length;
}

// Oldest first — the shape a stat tile's sparkline plots.
export function dailySignupCounts(users: AdminUser[], days: number): number[] {
    const buckets = new Array<number>(days).fill(0);
    for (const user of users) {
        const age = daysAgo(user.createdAt);
        if (age >= 0 && age < days) buckets[days - 1 - age] += 1;
    }
    return buckets;
}

// Same buckets as dailySignupCounts, but as labeled points since a real chart (unlike a sparkline) needs an axis.
export function signupTrend(users: AdminUser[], days: number): TrendPoint[] {
    const counts = dailySignupCounts(users, days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return counts.map((value, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value };
    });
}

