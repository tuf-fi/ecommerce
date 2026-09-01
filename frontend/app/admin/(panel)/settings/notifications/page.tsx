"use client";

import { useState } from "react";
import Toggle from "@/components/ui/Toggle";

const CARD = "mb-6 bg-white";
const CARD_HEADER = "border-b border-ink/10 pb-4.5";
const CARD_TITLE = "m-0 text-[15px] font-medium text-ink";

export default function AdminNotificationSettingsPage() {
    const [notifyOrders, setNotifyOrders] = useState(true);
    const [notifyLowStock, setNotifyLowStock] = useState(true);
    const [notifyStaff, setNotifyStaff] = useState(false);

    return (
        <div>
            <div className={CARD}>
                <div className={CARD_HEADER}>
                    <h3 className={CARD_TITLE}>Notification Preferences</h3>
                </div>
                <div className="flex flex-col divide-y divide-ink/10">
                    <div className="flex items-center justify-between gap-6 py-4.5">
                        <p className="m-0 text-[13px] text-ink">Email me about new orders</p>
                        <Toggle checked={notifyOrders} onChange={setNotifyOrders} />
                    </div>
                    <div className="flex items-center justify-between gap-6 py-4.5">
                        <p className="m-0 text-[13px] text-ink">Email me about low stock</p>
                        <Toggle checked={notifyLowStock} onChange={setNotifyLowStock} />
                    </div>
                    <div className="flex items-center justify-between gap-6 py-4.5">
                        <p className="m-0 text-[13px] text-ink">Email me about staff changes</p>
                        <Toggle checked={notifyStaff} onChange={setNotifyStaff} />
                    </div>
                </div>
            </div>
        </div>
    );
}
