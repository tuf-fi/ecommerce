import { AdminOrder } from "./types";
// Type-only, so this stays erased at build time and doesn't create a runtime
// import cycle with dashboard.ts (which imports ADMIN_ORDERS from here).
import type { TrendPoint } from "./dashboard";
import { getProduct } from "../products";

export function orderItemCount(order: AdminOrder): number {
    return order.items.reduce((sum, item) => sum + item.qty, 0);
}

export function orderTotal(order: AdminOrder): number {
    return order.items.reduce((sum, item) => sum + (getProduct(item.productId)?.price ?? 0) * item.qty, 0);
}

// Order counts for the most recent `days` dates that *appear in the data*,
// oldest first — not a rolling calendar window, which at this order volume
// would be mostly zeros and read as an outage rather than a quiet week.
export function ordersPerDay(orders: AdminOrder[], days = 8): TrendPoint[] {
    const counts = new Map<string, number>();
    for (const order of orders) counts.set(order.date, (counts.get(order.date) ?? 0) + 1);

    return [...counts.entries()]
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-days)
        .map(([date, value]) => ({ label: date.replace(/,\s*\d{4}$/, ""), value }));
}

// Same "most recent days that actually appear in the data" convention as
// ordersPerDay, summing revenue instead of counting orders.
export function revenuePerDay(orders: AdminOrder[], days = 8): TrendPoint[] {
    const totals = new Map<string, number>();
    for (const order of orders) totals.set(order.date, (totals.get(order.date) ?? 0) + orderTotal(order));

    return [...totals.entries()]
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-days)
        .map(([date, value]) => ({ label: date.replace(/,\s*\d{4}$/, ""), value }));
}

// TODO: replace with real order data from the backend API once admin order
// management is wired to a live checkout/payments system.
export const ADMIN_ORDERS: AdminOrder[] = [
    {
        no: "LM-2296",
        customer: "Jill Ramos",
        email: "jill.ramos@gmail.com",
        address: "221B Kalayaan Ave, Quezon City, Metro Manila",
        date: "Aug 30, 2026",
        status: "Pending",
        items: [{ productId: 1, qty: 1 }],
    },
    {
        no: "LM-2296B",
        customer: "Patricia Lim",
        email: "patricia.lim@gmail.com",
        address: "27 Timog Ave, Quezon City, Metro Manila",
        date: "Aug 30, 2026",
        status: "Pending",
        items: [{ productId: 4, qty: 1 }],
    },
    {
        no: "LM-2295",
        customer: "Andrea Cruz",
        email: "andrea.cruz@yahoo.com",
        address: "45 Marcos Highway, Marikina City, Metro Manila",
        date: "Aug 29, 2026",
        status: "Pending",
        items: [{ productId: 5, qty: 1 }],
    },
    {
        no: "LM-2294",
        customer: "Jill Ramos",
        email: "jill.ramos@gmail.com",
        address: "221B Kalayaan Ave, Quezon City, Metro Manila",
        date: "Aug 27, 2026",
        status: "Paid",
        items: [{ productId: 2, qty: 1 }],
    },
    {
        no: "LM-2294B",
        customer: "Bea Villanueva",
        email: "bea.villanueva@gmail.com",
        address: "3 Aguinaldo Hwy, Bacoor, Cavite",
        date: "Aug 27, 2026",
        status: "Shipped",
        items: [{ productId: 6, qty: 1 }],
    },
    {
        no: "LM-2293",
        customer: "Miguel Santos",
        email: "miguel.santos@gmail.com",
        address: "12 Pioneer St, Mandaluyong City, Metro Manila",
        date: "Aug 26, 2026",
        status: "Shipped",
        items: [{ productId: 3, qty: 2 }],
    },
    {
        no: "LM-2291",
        customer: "Camille Torres",
        email: "camille.torres@outlook.com",
        address: "88 Katipunan Ave, Quezon City, Metro Manila",
        date: "Aug 24, 2026",
        status: "Shipped",
        items: [{ productId: 8, qty: 1 }],
    },
    {
        no: "LM-2290",
        customer: "Miguel Santos",
        email: "miguel.santos@gmail.com",
        address: "12 Pioneer St, Mandaluyong City, Metro Manila",
        date: "Aug 21, 2026",
        status: "Delivered",
        items: [{ productId: 7, qty: 1 }],
    },
    {
        no: "LM-2290B",
        customer: "Camille Torres",
        email: "camille.torres@outlook.com",
        address: "88 Katipunan Ave, Quezon City, Metro Manila",
        date: "Aug 21, 2026",
        status: "Delivered",
        items: [{ productId: 2, qty: 1 }],
    },
    {
        no: "LM-2290C",
        customer: "Carlo Domingo",
        email: "carlo.domingo@gmail.com",
        address: "9 Sumulong Highway, Marikina City, Metro Manila",
        date: "Aug 21, 2026",
        status: "Delivered",
        items: [{ productId: 5, qty: 1 }],
    },
    {
        no: "LM-2288",
        customer: "Bea Villanueva",
        email: "bea.villanueva@gmail.com",
        address: "3 Aguinaldo Hwy, Bacoor, Cavite",
        date: "Aug 18, 2026",
        status: "Cancelled",
        items: [{ productId: 4, qty: 1 }],
    },
    {
        no: "LM-2285",
        customer: "Camille Torres",
        email: "camille.torres@outlook.com",
        address: "88 Katipunan Ave, Quezon City, Metro Manila",
        date: "Aug 12, 2026",
        status: "Delivered",
        items: [{ productId: 6, qty: 1 }],
    },
    {
        no: "LM-2285B",
        customer: "Patricia Lim",
        email: "patricia.lim@gmail.com",
        address: "27 Timog Ave, Quezon City, Metro Manila",
        date: "Aug 12, 2026",
        status: "Delivered",
        items: [{ productId: 8, qty: 1 }],
    },
    {
        no: "LM-2281",
        customer: "Jill Ramos",
        email: "jill.ramos@gmail.com",
        address: "221B Kalayaan Ave, Quezon City, Metro Manila",
        date: "Aug 8, 2026",
        status: "Delivered",
        items: [{ productId: 1, qty: 1 }],
    },
    {
        no: "LM-2277",
        customer: "Andrea Cruz",
        email: "andrea.cruz@yahoo.com",
        address: "45 Marcos Highway, Marikina City, Metro Manila",
        date: "Aug 3, 2026",
        status: "Delivered",
        items: [{ productId: 3, qty: 3 }],
    },
    {
        no: "LM-2270",
        customer: "Bea Villanueva",
        email: "bea.villanueva@gmail.com",
        address: "3 Aguinaldo Hwy, Bacoor, Cavite",
        date: "Jul 28, 2026",
        status: "Delivered",
        items: [{ productId: 4, qty: 2 }],
    },
    {
        no: "LM-2261",
        customer: "Miguel Santos",
        email: "miguel.santos@gmail.com",
        address: "12 Pioneer St, Mandaluyong City, Metro Manila",
        date: "Jul 20, 2026",
        status: "Cancelled",
        items: [{ productId: 2, qty: 1 }],
    },
];
