"use client";

import { toast } from "sonner";

const CARD = "mb-6 bg-white";
const CARD_HEADER = "border-b border-ink/10 pb-4.5";
const CARD_TITLE = "m-0 text-[15px] font-medium text-ink";

export default function AdminSessionsSettingsPage() {
    function handleLogoutOtherDevices() {
        // TODO: real session listing/revocation once auth is backed by JWT sessions.
        toast.success("Signed out of all other devices.");
    }

    return (
        <div>
            <div className={CARD}>
                <div className={CARD_HEADER}>
                    <h3 className={CARD_TITLE}>Active Sessions</h3>
                </div>
                <div className="flex flex-col divide-y divide-ink/10">
                    <div className="flex items-center justify-between gap-6 py-4.5">
                        <div>
                            <div className="text-[13px] font-medium text-ink">This device</div>
                            <div className="font-mono text-[11px] text-grey">Chrome on Windows — Manila, PH</div>
                        </div>
                        <span className="font-mono text-[11px] text-success-dark">Active now</span>
                    </div>
                    <div className="flex items-center justify-between gap-6 py-4.5">
                        <div>
                            <div className="text-[13px] font-medium text-ink">Safari on iPhone</div>
                            <div className="font-mono text-[11px] text-grey">Manila, PH</div>
                        </div>
                        <span className="font-mono text-[11px] text-grey">2 days ago</span>
                    </div>
                </div>
                <div className="py-7">
                    <button
                        disabled
                        onClick={handleLogoutOtherDevices}
                        className="bg-off px-5 py-3 text-[13px] font-semibold tracking-wide text-grey"
                    >
                        Log out all other devices
                    </button>
                </div>
            </div>
        </div>
    );
}
