"use client";

import { useState } from "react";
import Toggle from "@/components/ui/Toggle";
import PageHeading from "@/components/ui/PageHeading";

const NOTIFICATION_ROWS = [
    { key: "orders", label: "Order Updates", sub: "Shipping, delivery, and payment status" },
    { key: "promos", label: "Promotions", sub: "Sales, restocks, and limited drops" },
    { key: "newsletter", label: "The Journal", sub: "New posts on routines and ingredients" },
] as const;

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Record<string, boolean>>({
        orders: true,
        promos: true,
        newsletter: false,
    });

    return (
        <div>
            <PageHeading>Notification Settings</PageHeading>
            <div className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                {NOTIFICATION_ROWS.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-4 py-4">
                        <div>
                            <div className="text-[13.5px] text-ink">{row.label}</div>
                            <div className="text-[12px] text-grey">{row.sub}</div>
                        </div>
                        <Toggle
                            checked={notifications[row.key]}
                            onChange={(v) => setNotifications((n) => ({ ...n, [row.key]: v }))}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
