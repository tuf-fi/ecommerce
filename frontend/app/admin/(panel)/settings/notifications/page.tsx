"use client";

import { useState } from "react";
import { toast } from "sonner";
import Toggle from "@/components/ui/Toggle";
import PageHeading from "@/components/ui/PageHeading";

const NOTIFICATION_ROWS = [
    { key: "orders", label: "New Orders", sub: "Email me when a new order comes in" },
    { key: "lowStock", label: "Low Stock", sub: "Email me when inventory runs low" },
    { key: "staff", label: "Staff Changes", sub: "Email me about staff account changes" },
] as const;

export default function AdminNotificationSettingsPage() {
    // TODO: persist to backend once it exists.
    const [notifications, setNotifications] = useState<Record<string, boolean>>({
        orders: true,
        lowStock: true,
        staff: false,
    });

    function handleToggle(key: string, value: boolean) {
        setNotifications((n) => ({ ...n, [key]: value }));
        toast.success("Preference updated (demo only — not saved yet).");
    }

    return (
        <div>
            <PageHeading>Notification Preferences</PageHeading>
            <div className="flex flex-col divide-y divide-ink/10 border-b border-ink/10">
                {NOTIFICATION_ROWS.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-4 py-4">
                        <div>
                            <div className="text-[13.5px] text-ink">{row.label}</div>
                            <div className="text-[12px] text-grey">{row.sub}</div>
                        </div>
                        <Toggle
                            checked={notifications[row.key]}
                            onChange={(v) => handleToggle(row.key, v)}
                            ariaLabel={row.label}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
