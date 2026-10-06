"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/library/store";
import { useScrollActiveIntoView } from "@/library/useScrollActiveIntoView";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const navGroups = [
    {
        label: "Account",
        items: [
            {
                label: "My Account",
                href: "/account",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                ),
            },
            {
                label: "Notifications",
                href: "/account/notifications",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                    </svg>
                ),
            },
            {
                label: "My Purchase",
                href: "/account/purchases",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="4" y="4" width="16" height="17" rx="1.5" />
                        <path d="M8 9h8M8 13h8M8 17h5" />
                    </svg>
                ),
            },
            {
                label: "Saved Addresses",
                href: "/account/addresses",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                ),
            },
            {
                label: "Change Password",
                href: "/account/password",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="4" y="11" width="16" height="9" rx="1.5" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Rewards",
        items: [
            {
                label: "My Vouchers",
                href: "/account/vouchers",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
                        <path d="M10 6v12" strokeDasharray="2.5 2.5" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Support",
        items: [
            {
                label: "Help & Support",
                href: "/account/help",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 1.9-2.4 3.5" />
                        <path d="M12 17.5h.01" />
                    </svg>
                ),
            },
            {
                label: "Privacy Policy",
                href: "/account/privacy-policy",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 2.5 4 6v6c0 5 3.4 8.2 8 9.5 4.6-1.3 8-4.5 8-9.5V6l-8-3.5Z" />
                    </svg>
                ),
            },
            {
                label: "Terms of Service",
                href: "/account/terms",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M7 3h8l4 4v14H7V3Z" />
                        <path d="M10 12h6M10 16h6" />
                    </svg>
                ),
            },
        ],
    },
] as const;

function initials(name: string) {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
}

export default function AccountShell({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, sessionChecked, customerName, signOut } = useStore();
    const pathname = usePathname();
    const router = useRouter();
    const navBox = useRef<HTMLDivElement>(null);
    const ready = sessionChecked && isLoggedIn;
    useScrollActiveIntoView(navBox, [pathname, ready]);

    useEffect(() => {
        // Wait for the session check: on a reload isLoggedIn starts false, which would otherwise bounce to the homepage.
        if (sessionChecked && !isLoggedIn) router.replace("/");
    }, [sessionChecked, isLoggedIn, router]);

    if (!sessionChecked) return <AccountShellSkeleton />;
    if (!isLoggedIn) return null;

    function handleSignOut() {
        signOut();
        router.push("/");
    }

    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] pt-[var(--navbar-h,68px)]">
            <div className="shadow-glow grid grid-cols-1 grid-rows-[auto_1fr] lg:grid-rows-none border-t border-ink/10 bg-white min-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px))] lg:grid-cols-[260px_1fr]">
                <aside className="relative z-10 flex min-w-0 flex-col border-b border-ink/10 bg-white lg:border-r lg:border-b-0">
                    <div ref={navBox} className="thin-scrollbar min-w-0 overflow-x-hidden px-[var(--gutter)] pt-5 pb-0 lg:px-6 lg:pt-10 lg:pb-6 lg:sticky lg:top-[calc(var(--navbar-h,68px)+var(--promo-h,0px))] lg:max-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px))] lg:overflow-y-auto">
                        <div className="mb-1 flex items-center justify-between gap-3 border-b border-ink/10 pb-4 lg:mb-4">
                        <Link
                            href="/account"
                            className="flex h-10 min-w-0 flex-1 items-center gap-3 transition hover:opacity-80"
                        >
                            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy font-mono text-[12.5px] text-white">
                                {initials(customerName)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{customerName}</span>
                        </Link>
                        <button onClick={handleSignOut} className="flex-none px-2 py-2.5 text-[12.5px] text-alert transition hover:bg-alert/5 lg:hidden">
                            Sign Out
                        </button>
                        </div>

                        <nav data-hscroll className="thin-scrollbar -mx-[var(--gutter)] flex flex-row gap-1 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0">
                            {navGroups.map((group) => (
                                <div key={group.label} className="flex min-w-0 flex-none flex-row gap-1 lg:block">
                                    <div className="mb-1 hidden px-2.5 font-mono lg:block text-[10px] uppercase tracking-[.16em] text-grey">
                                        {group.label}
                                    </div>
                                    <div className="flex flex-row gap-1 lg:flex-col lg:gap-px">
                                        {group.items.map((item) => {
                                            const active = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    aria-current={active ? "page" : undefined}
                                                    // Left accent bar + pink tint matches how the rest of the app marks "current".
                                                    className={`group flex min-w-0 flex-none items-center gap-2.5 whitespace-nowrap border-b-2 py-3 pr-3 pl-3 text-[12.5px] transition lg:border-b-0 lg:border-l-2 lg:py-1.5 lg:pr-2.5 ${
                                                        active
                                                            ? "border-pink-btn bg-pink-soft/50 font-semibold text-pink-dark"
                                                            : "border-transparent text-grey hover:border-ink/15 hover:bg-off/70 hover:text-ink"
                                                    }`}
                                                >
                                                    <span className={`flex-none transition ${active ? "text-pink-dark" : "text-grey group-hover:text-ink"}`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className="truncate">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        <div className="mt-4 hidden lg:block">
                            <button
                                onClick={handleSignOut}
                                className="flex w-full min-w-0 items-center gap-2.5 px-2.5 py-1.5 text-[12.5px] text-alert transition hover:bg-alert/5"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-none">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <path d="M16 17l5-5-5-5" />
                                    <path d="M21 12H9" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="min-w-0 px-[var(--gutter)] py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
            </div>
        </div>
    );
}

function AccountShellSkeleton() {
    return (
        <div className="-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)] pt-[var(--navbar-h,68px)]">
            <SkeletonGroup className="grid min-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px))] grid-cols-1 grid-rows-[auto_1fr] lg:grid-rows-none border-t border-ink/10 bg-white lg:grid-cols-[260px_1fr]">
                <div className="border-b border-ink/10 px-[var(--gutter)] pt-5 pb-4 lg:border-r lg:border-b-0 lg:px-6 lg:pt-10">
                    <div className="mb-4 flex items-center gap-3 border-b border-ink/10 pb-4">
                        <Skeleton className="h-10 w-10 flex-none rounded-full" />
                        <Skeleton className="h-[13px] w-32" />
                    </div>
                    <div className="flex gap-2 overflow-hidden lg:flex-col lg:gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} tone="soft" className="h-4 w-28 flex-none lg:w-full" />
                        ))}
                    </div>
                </div>
                <div className="min-w-0 px-[var(--gutter)] py-8 sm:px-8 lg:px-10 lg:py-10">
                    <div className="mb-6 border-b border-ink/10 pb-4">
                        <Skeleton className="h-[18px] w-44" />
                    </div>
                    <Skeleton tone="outline" className="h-11 w-full max-w-[520px]" />
                    <Skeleton tone="outline" className="mt-4 h-11 w-full max-w-[520px]" />
                </div>
            </SkeletonGroup>
        </div>
    );
}
