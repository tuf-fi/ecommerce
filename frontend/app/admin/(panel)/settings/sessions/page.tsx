"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { BTN_HEADER_ACTION, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import ListPanel from "@/components/admin/ListPanel";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup, SkeletonTable } from "@/components/ui/Skeleton";
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
            <ListPanel minWidth={760} footer={<>Showing {sessions.length} of {sessions.length}</>}>
                <thead>
                    <tr className={TABLE_HEAD_ROW}>
                        {["Device", "IP address", "Signed in", "Last active", ""].map((h, i) => (
                            <th key={i} scope="col" className={TABLE_TH}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sessions.map((s) => (
                        <tr key={s.id}>
                            <td className={`${TABLE_TD} text-[13px] font-medium whitespace-nowrap text-ink`}>
                                {describeDevice(s.userAgent)}
                                {s.current && <span className="ml-2 font-mono text-[10.5px] font-normal tracking-[.1em] text-success-dark uppercase">This device</span>}
                            </td>
                            <td className={`${TABLE_TD} font-mono text-[12px] whitespace-nowrap text-grey`}>{s.ip ?? "—"}</td>
                            <td className={`${TABLE_TD} font-mono text-[12px] whitespace-nowrap text-grey`}>{timeAgo(s.createdAt)}</td>
                            <td className={`${TABLE_TD} font-mono text-[12px] whitespace-nowrap ${s.current ? "text-success-dark" : "text-grey"}`}>
                                {s.current ? "Active now" : timeAgo(s.lastSeenAt)}
                            </td>
                            <td className={`${TABLE_TD} w-px text-right`}>
                                {!s.current && (
                                    <button onClick={() => signOut(s.id)} className="border border-ink/15 px-3.5 py-2 text-[12.5px] whitespace-nowrap text-ink transition hover:bg-off">
                                        Sign out
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </ListPanel>
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
            <SkeletonTable rows={3} cols={5} />
        </SkeletonGroup>
    );
}
