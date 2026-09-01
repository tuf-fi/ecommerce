import { AdminOrderStatus } from "@/library/admin/types";
import { BadgeTone } from "./StatusBadge";

export const ORDER_STATUS_TONE: Record<AdminOrderStatus, BadgeTone> = {
    Pending: "warning",
    Paid: "neutral",
    Shipped: "neutral",
    Delivered: "success",
    Cancelled: "alert",
};

export const ORDER_STATUSES: AdminOrderStatus[] = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];
