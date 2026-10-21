import { AdminOrder } from "./types";
import type { TrendPoint } from "./dashboard";
import { getProduct, currentPrice } from "../products";

export function orderItemCount(order: AdminOrder): number {
    return order.items.reduce((sum, item) => sum + item.qty, 0);
}

export function orderTotal(order: AdminOrder): number {
    if (order.total !== undefined) return order.total;
    return order.items.reduce((sum, item) => sum + (item.unitPrice ?? (getProduct(item.productId) ? currentPrice(getProduct(item.productId)!) : 0)) * item.qty, 0);
}

// Revenue only counts orders with confirmed payment (Paid onward); Pending hasn't been verified and Cancelled never completes.
export const countsAsRevenue = (order: AdminOrder) => order.status === "Paid" || order.status === "Shipped" || order.status === "Delivered";
export const countsAsOrder = (order: AdminOrder) => order.status !== "Cancelled";

// Uses the most recent `days` dates that appear in the data, not a rolling calendar window — at this order volume a real window would read as mostly zeros.
// The dates come from every order, so the last point is the same "latest day" the card's headline number is for, even when that day has no counted orders (it plots as 0, not as the day before).
function perDay(orders: AdminOrder[], days: number, valueOf: (day: AdminOrder[]) => number): TrendPoint[] {
    const byDate = new Map<string, AdminOrder[]>();
    for (const order of orders) byDate.set(order.date, [...(byDate.get(order.date) ?? []), order]);

    return [...byDate.entries()]
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-days)
        .map(([date, day]) => ({ label: date.replace(/,\s*\d{4}$/, ""), value: valueOf(day) }));
}

export function ordersPerDay(orders: AdminOrder[], days = 8): TrendPoint[] {
    return perDay(orders, days, (day) => day.filter(countsAsOrder).length);
}

// Summing revenue instead of counting orders.
export function revenuePerDay(orders: AdminOrder[], days = 8): TrendPoint[] {
    return perDay(orders, days, (day) => day.filter(countsAsRevenue).reduce((sum, o) => sum + orderTotal(o), 0));
}

