import { AdminOrder } from "./types";
import { getProduct } from "../products";

export function orderItemCount(order: AdminOrder): number {
    return order.items.reduce((sum, item) => sum + item.qty, 0);
}

export function orderTotal(order: AdminOrder): number {
    return order.items.reduce((sum, item) => sum + (getProduct(item.productId)?.price ?? 0) * item.qty, 0);
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
