// Estimates that follow the Shipping & Returns policy: orders ship within 1–2 business days; Metro Manila arrives in
// 2–4 days after that, everywhere else in 5–7. They are estimates only; nothing here is promised by the server.
const SHIP_DAYS: [number, number] = [1, 2];
const METRO_DAYS: [number, number] = [2, 4];
const PROVINCIAL_DAYS: [number, number] = [5, 7];

const METRO_MANILA =
    /\b(metro manila|ncr|manila|quezon city|makati|taguig|pasig|mandaluyong|marikina|pasay|para[ñn]aque|las pi[ñn]as|muntinlupa|caloocan|malabon|navotas|valenzuela|san juan|pateros)\b/i;

function addBusinessDays(from: Date, days: number): Date {
    const d = new Date(from);
    let left = days;
    while (left > 0) {
        d.setDate(d.getDate() + 1);
        const day = d.getDay();
        if (day !== 0 && day !== 6) left -= 1;
    }
    return d;
}

function addDays(from: Date, days: number): Date {
    const d = new Date(from);
    d.setDate(d.getDate() + days);
    return d;
}

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const range = (a: Date, b: Date) => (a.getTime() === b.getTime() ? fmt(a) : `${fmt(a)} – ${fmt(b)}`);

export type DeliveryEstimate = { ships: string; arrives: string; zone: "Metro Manila" | "Provincial" };

export function estimateDelivery(address: string, now: Date = new Date()): DeliveryEstimate {
    const zone = METRO_MANILA.test(address) ? "Metro Manila" : "Provincial";
    const [d1, d2] = zone === "Metro Manila" ? METRO_DAYS : PROVINCIAL_DAYS;
    const shipEarly = addBusinessDays(now, SHIP_DAYS[0]);
    const shipLate = addBusinessDays(now, SHIP_DAYS[1]);
    return {
        zone,
        ships: range(shipEarly, shipLate),
        arrives: range(addDays(shipEarly, d1), addDays(shipLate, d2)),
    };
}
