"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsSection, SettingsList, SettingsRow } from "@/components/admin/settings/SettingsSection";
import { BTN_HEADER_ACTION } from "@/components/admin/formClasses";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import { ApiError } from "@/library/api/client";
import { AdminSessionInfo, listAdminSessions, revokeAdminSession, revokeOtherAdminSessions } from "@/library/api/auth";

// Best-effort "Chrome on Windows" from a User-Agent string; falls back to what little can be read.
function describeDevice(userAgent: string | null): string {
    if (!userAgent) return "Unknown device";
    const browser = /Edg\//.test(userAgent) ? "Edge" : /Firefox\//.test(userAgent) ? "Firefox" : /Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : userAgent.split("/")[0];
    const os = /Windows/.test(userAgent) ? "Windows" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Android/.test(userAgent) ? "Android" : /Mac OS X/.test(userAgent) ? "macOS" : /Linux/.test(userAgent) ? "Linux" : null;
    return os ? `${browser} on ${os}` : browser;
}

function timeAgo(iso: string): string {
    const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (seconds < 90) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return `${hours} hr ago`;
    return `${Math.round(hours / 24)} days ago`;
}

const message = (err: unknown) => (err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");

export default function AdminSessionsSettingsPage() {
    const mounted = useMounted();
    const [sessions, setSessions] = useState<AdminSessionInfo[] | null>(null);

    const load = useCallback(async () => {
        try {
            setSessions((await listAdminSessions()).sessions);
        } catch (err) {
            toast.error(message(err));
            setSessions([]);
        }
    }, []);

    useEffect(() => {
        // Loads once on arrival; state is set after the awaited request, not synchronously.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    async function signOutOthers() {
        try {
            const { revoked } = await revokeOtherAdminSessions();
            toast.success(revoked > 0 ? `Signed out of ${revoked} other device${revoked === 1 ? "" : "s"}.` : "No other devices were signed in.");
        } catch (err) {
            toast.error(message(err));
        }
        await load();
    }

    async function signOut(id: string) {
        try {
            await revokeAdminSession(id);
            toast.success("Signed out.");
        } catch (err) {
            toast.error(message(err));
        }
        await load();
    }

    if (!mounted || sessions === null) return <SessionsSettingsSkeleton />;

    const others = sessions.filter((s) => !s.current).length;

    return (
        // Uses the same PageHeading `action` slot as Purchases/Addresses, not a floating button.
        <SettingsSection
            title="Active Sessions"
            action={
                <button onClick={signOutOthers} disabled={others === 0} className={`${BTN_HEADER_ACTION} disabled:cursor-not-allowed disabled:opacity-50`}>
                    Log out all other devices
                </button>
            }
        >
            <SettingsList>
                {sessions.map((s) => (
                    <SettingsRow
                        key={s.id}
                        label={s.current ? `${describeDevice(s.userAgent)} (this device)` : describeDevice(s.userAgent)}
                        description={
                            <span className="font-mono text-[11px]">
                                {s.ip ? `${s.ip} · ` : ""}signed in {timeAgo(s.createdAt)}
                            </span>
                        }
                        control={
                            s.current ? (
                                <span className="font-mono text-[11px] text-success-dark">Active now</span>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-[11px] text-grey">Active {timeAgo(s.lastSeenAt)}</span>
                                    <button onClick={() => signOut(s.id)} className="text-[12px] font-semibold text-pink-dark underline underline-offset-2 hover:text-pink-btn">
                                        Sign out
                                    </button>
                                </div>
                            )
                        }
                    />
                ))}
            </SettingsList>
        </SettingsSection>
    );
}

function SessionsSettingsSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 flex h-10 items-center justify-between border-b border-ink/10 pb-4">
                <Skeleton className="h-[18px] w-36" />
                <Skeleton tone="outline" className="h-[33px] w-48" />
            </div>
            {[0, 1].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4 border-b border-ink/10 py-4">
                    <div>
                        <Skeleton className="h-[13.5px] w-40" />
                        <Skeleton tone="soft" className="mt-1.5 h-3 w-48" />
                    </div>
                    <Skeleton tone="soft" className="h-3 w-20" />
                </div>
            ))}
        </SkeletonGroup>
    );
}
