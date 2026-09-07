import { AdminUser } from "./types";
import type { TrendPoint } from "./dashboard";

// Local midnight for an ISO `YYYY-MM-DD`, parsed field-by-field rather than
// through `new Date(iso)` — the latter reads a bare ISO date as UTC, which
// lands on the wrong calendar day for anyone west of Greenwich.
function startOfDay(iso: string): number {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
}

function daysAgo(iso: string): number {
    return Math.round((new Date().setHours(0, 0, 0, 0) - startOfDay(iso)) / (1000 * 60 * 60 * 24));
}

// Number of accounts created within the last `days` calendar days, today
// included. Bucketed off the real current date (same convention as
// `daysUntilExpiry` in products.ts), not the dataset's own latest entry.
export function newUsersInLastDays(users: AdminUser[], days: number): number {
    return users.filter((u) => {
        const age = daysAgo(u.createdAt);
        return age >= 0 && age < days;
    }).length;
}

// Signups per day for the last `days` days, oldest first — the shape a stat
// tile's sparkline plots.
export function dailySignupCounts(users: AdminUser[], days: number): number[] {
    const buckets = new Array<number>(days).fill(0);
    for (const user of users) {
        const age = daysAgo(user.createdAt);
        if (age >= 0 && age < days) buckets[days - 1 - age] += 1;
    }
    return buckets;
}

// Same buckets as dailySignupCounts, but as labeled points for a real chart
// (a sparkline has no axis to label) — one entry per calendar day, oldest
// first, dated off today rather than the dataset's own latest entry.
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

// TODO: replace with real registered-customer accounts from the backend.
// Standalone mock signups — deliberately not derived from ADMIN_ORDERS'
// customers, since this tracks account creation, not purchasing. Dates are
// anchored near the prototype's current date so the 7-day window and the
// sparkline both have something to show.
export const ADMIN_USERS: AdminUser[] = [
    { id: 1, name: "Rico Delgado", email: "rico.delgado@gmail.com", createdAt: "2026-08-03" },
    { id: 2, name: "Marianne Sy", email: "marianne.sy@yahoo.com", createdAt: "2026-08-05" },
    { id: 3, name: "Paolo Enriquez", email: "paolo.enriquez@gmail.com", createdAt: "2026-08-08" },
    { id: 4, name: "Kristine Abad", email: "kristine.abad@outlook.com", createdAt: "2026-08-11" },
    { id: 5, name: "Dennis Ocampo", email: "dennis.ocampo@gmail.com", createdAt: "2026-08-13" },
    { id: 6, name: "Frances Lim", email: "frances.lim@yahoo.com", createdAt: "2026-08-16" },
    { id: 7, name: "Althea Bautista", email: "althea.bautista@gmail.com", createdAt: "2026-08-18" },
    { id: 8, name: "Trisha Mendoza", email: "trisha.mendoza@gmail.com", createdAt: "2026-08-20" },
    { id: 9, name: "Lorenzo Fajardo", email: "lorenzo.fajardo@outlook.com", createdAt: "2026-08-22" },
    { id: 10, name: "Aubrey Pineda", email: "aubrey.pineda@gmail.com", createdAt: "2026-08-24" },
    { id: 11, name: "Nathaniel Yu", email: "nathaniel.yu@yahoo.com", createdAt: "2026-08-25" },
    { id: 12, name: "Rhea Gutierrez", email: "rhea.gutierrez@gmail.com", createdAt: "2026-08-26" },
    { id: 13, name: "Carlo Bermudez", email: "carlo.bermudez@gmail.com", createdAt: "2026-08-26" },
    { id: 14, name: "Isabel Nery", email: "isabel.nery@outlook.com", createdAt: "2026-08-27" },
    { id: 15, name: "Gab Trinidad", email: "gab.trinidad@gmail.com", createdAt: "2026-08-27" },
    { id: 16, name: "Marife Alcantara", email: "marife.alcantara@yahoo.com", createdAt: "2026-08-28" },
    { id: 17, name: "Vince Aguilar", email: "vince.aguilar@gmail.com", createdAt: "2026-08-28" },
    { id: 18, name: "Danica Robles", email: "danica.robles@gmail.com", createdAt: "2026-08-29" },
    { id: 19, name: "Kenji Tolentino", email: "kenji.tolentino@outlook.com", createdAt: "2026-08-29" },
    { id: 20, name: "Sofia Ramirez", email: "sofia.ramirez@gmail.com", createdAt: "2026-08-29" },
    { id: 21, name: "Elmer Padilla", email: "elmer.padilla@yahoo.com", createdAt: "2026-08-30" },
    { id: 22, name: "Joy Castillo", email: "joy.castillo@gmail.com", createdAt: "2026-08-30" },
    { id: 23, name: "Arvin Espinosa", email: "arvin.espinosa@gmail.com", createdAt: "2026-08-31" },
    { id: 24, name: "Nicole Bacani", email: "nicole.bacani@outlook.com", createdAt: "2026-09-01" },
    { id: 25, name: "Ferdie Malabanan", email: "ferdie.malabanan@gmail.com", createdAt: "2026-09-01" },
    { id: 26, name: "Hazel Cordero", email: "hazel.cordero@yahoo.com", createdAt: "2026-09-02" },
    { id: 27, name: "Miko Panganiban", email: "miko.panganiban@gmail.com", createdAt: "2026-09-02" },
    { id: 28, name: "Jomar Salazar", email: "jomar.salazar@gmail.com", createdAt: "2026-09-03" },
];
