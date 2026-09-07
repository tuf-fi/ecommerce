"use client";

import { toast } from "sonner";
import PageHeading from "@/components/ui/PageHeading";

export default function AdminSessionsSettingsPage() {
    function handleLogoutOtherDevices() {
        // TODO: real session listing/revocation once auth is backed by JWT sessions.
        toast.success("Signed out of all other devices.");
    }

    return (
        <div>
            <PageHeading>Active Sessions</PageHeading>
            <div className="flex flex-col divide-y divide-ink/10 border-b border-ink/10">
                <div className="flex items-center justify-between gap-6 py-4">
                    <div>
                        <div className="text-[13.5px] text-ink">This device</div>
                        <div className="mt-0.5 font-mono text-[11px] text-grey">Chrome on Windows — Manila, PH</div>
                    </div>
                    <span className="font-mono text-[11px] text-success-dark">Active now</span>
                </div>
                <div className="flex items-center justify-between gap-6 py-4">
                    <div>
                        <div className="text-[13.5px] text-ink">Safari on iPhone</div>
                        <div className="mt-0.5 font-mono text-[11px] text-grey">Manila, PH</div>
                    </div>
                    <span className="font-mono text-[11px] text-grey">2 days ago</span>
                </div>
            </div>

            <button
                disabled
                onClick={handleLogoutOtherDevices}
                className="mt-6 bg-off px-5 py-3 text-[13px] font-semibold tracking-wide text-grey"
            >
                Log out all other devices
            </button>
        </div>
    );
}
