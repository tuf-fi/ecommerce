"use client";

import { useState } from "react";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTH: Record<Device, string> = {
    desktop: "max-w-none",
    tablet: "max-w-[768px]",
    mobile: "max-w-[375px]",
};

function DesktopIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="12" rx="1" />
            <path d="M8 20h8M12 16v4" />
        </svg>
    );
}

function TabletIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="2.5" width="14" height="19" rx="1.5" />
            <path d="M12 17.5h.01" />
        </svg>
    );
}

function MobileIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="7" y="2" width="10" height="20" rx="1.5" />
            <path d="M12 18h.01" />
        </svg>
    );
}

const DEVICES: { key: Device; label: string; icon: () => React.JSX.Element }[] = [
    { key: "desktop", label: "Desktop", icon: DesktopIcon },
    { key: "tablet", label: "Tablet", icon: TabletIcon },
    { key: "mobile", label: "Mobile", icon: MobileIcon },
];

export default function LivePreviewPane({ label, children }: { label: string; children: React.ReactNode }) {
    const [device, setDevice] = useState<Device>("desktop");

    return (
        <div className="flex flex-col border-b border-ink/10 bg-white">
            <div className="flex flex-none items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5 font-mono text-[10.5px] tracking-[.06em] text-grey uppercase">
                <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 flex-none animate-pulse rounded-full bg-success" />
                    Live Preview — {label}
                </div>
                <div className="flex items-center gap-1">
                    {DEVICES.map(({ key, label: deviceLabel, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setDevice(key)}
                            aria-label={deviceLabel}
                            aria-pressed={device === key}
                            className={`flex h-6 w-6 items-center justify-center rounded-full normal-case transition ${
                                device === key ? "bg-off text-ink" : "text-grey hover:text-ink"
                            }`}
                        >
                            <Icon />
                        </button>
                    ))}
                </div>
            </div>
            {/* No padding around the content itself — the device toggle only ever
                changes this box's *width*; whatever renders inside it fills that
                width edge to edge, exactly like the real page would.
                This outer div only exists so the `mx-auto` one below is normal
                block flow, not a flex item — as a direct flex child, its auto
                margins would disable stretch and shrink it to fit-content,
                collapsing to 0 width since Hero's own children are all
                absolutely positioned and contribute no intrinsic width. */}
            <div>
                <div
                    className={`${DEVICE_WIDTH[device]} mx-auto transition-[max-width] duration-300 ${
                        device === "desktop" ? "" : "border border-ink/10"
                    }`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
