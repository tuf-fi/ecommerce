import { AdminNotification } from "./types";

export const NOTIFICATIONS: AdminNotification[] = [
    {
        id: 1,
        text: "New order LM-2296 received from Jill Ramos",
        time: "12 min ago",
        read: false,
        type: "order",
        ref: "LM-2296",
    },
    {
        id: 2,
        text: "New order LM-2295 received from Andrea Cruz",
        time: "38 min ago",
        read: false,
        type: "order",
        ref: "LM-2295",
    },
    {
        id: 3,
        text: "Niacinamide Pore Refiner is running low on stock (4 left)",
        time: "2 hours ago",
        read: false,
        type: "inventory",
    },
    {
        id: 4,
        text: "Rice Milk Body Wash is out of stock",
        time: "5 hours ago",
        read: true,
        type: "inventory",
    },
    {
        id: 5,
        text: "Kaye Manalo was added to Staff & Roles",
        time: "Yesterday",
        read: true,
        type: "staff",
    },
    {
        id: 6,
        text: "Order LM-2290 was marked Delivered",
        time: "2 days ago",
        read: true,
        type: "order",
        ref: "LM-2290",
    },
];
