import { AdminOrder } from "./types";
import type { TrendPoint } from "./dashboard";
import { getProduct } from "../products";

export function orderItemCount(order: AdminOrder): number {
    return order.items.reduce((sum, item) => sum + item.qty, 0);
}

export function orderTotal(order: AdminOrder): number {
    if (order.total !== undefined) return order.total;
    return order.items.reduce((sum, item) => sum + (item.unitPrice ?? getProduct(item.productId)?.price ?? 0) * item.qty, 0);
}

// Uses the most recent `days` dates that appear in the data, not a rolling calendar window — at this order volume a real window would read as mostly zeros.
export function ordersPerDay(orders: AdminOrder[], days = 8): TrendPoint[] {
    const counts = new Map<string, number>();
    for (const order of orders) counts.set(order.date, (counts.get(order.date) ?? 0) + 1);

    return [...counts.entries()]
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-days)
        .map(([date, value]) => ({ label: date.replace(/,\s*\d{4}$/, ""), value }));
}

// Same "dates that appear in the data" convention as ordersPerDay, summing revenue instead of counting orders.
export function revenuePerDay(orders: AdminOrder[], days = 8): TrendPoint[] {
    const totals = new Map<string, number>();
    for (const order of orders) totals.set(order.date, (totals.get(order.date) ?? 0) + orderTotal(order));

    return [...totals.entries()]
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-days)
        .map(([date, value]) => ({ label: date.replace(/,\s*\d{4}$/, ""), value }));
}

