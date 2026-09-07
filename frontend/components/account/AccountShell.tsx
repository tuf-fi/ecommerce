"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/library/store";

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
        label: "Preferences",
        items: [
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
                href: "/account/privacy",
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 2.5 4 6v6c0 5 3.4 8.2 8 9.5 4.6-1.3 8-4.5 8-9.5V6l-8-3.5Z" />
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
    const { isLoggedIn, customerName, signOut } = useStore();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) router.replace("/");
    }, [isLoggedIn, router]);

    if (!isLoggedIn) return null;

    function handleSignOut() {
        signOut();
        router.push("/");
    }

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] pt-[var(--navbar-h,68px)]">
            <div className="shadow-glow grid grid-cols-1 border-t border-ink/10 bg-white min-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px))] lg:grid-cols-[260px_1fr]">
                <aside className="relative z-10 flex min-w-0 flex-col border-b border-ink/10 bg-white lg:border-r lg:border-b-0">
                    <div className="thin-scrollbar min-w-0 overflow-x-hidden px-6 pt-10 pb-6 lg:sticky lg:top-[calc(var(--navbar-h,68px)+var(--promo-h,0px))] lg:max-h-[calc(100vh-var(--navbar-h,68px)-var(--promo-h,0px))] lg:overflow-y-auto">
                        <Link
                            href="/account"
                            className="mb-4 flex h-10 min-w-0 items-center gap-3 border-b border-ink/10 pb-4 transition hover:opacity-80"
                        >
                            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy font-mono text-[12.5px] text-white">
                                {initials(customerName)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{customerName}</span>
                        </Link>

                        <nav className="flex flex-col gap-4">
                            {navGroups.map((group) => (
                                <div key={group.label} className="min-w-0">
                                    <div className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-[.16em] text-grey">
                                        {group.label}
                                    </div>
                                    <div className="flex flex-col gap-px">
                                        {group.items.map((item) => {
                                            const active = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex min-w-0 items-center gap-2.5 px-2.5 py-1.5 text-[12.5px] transition ${
                                                        active ? "bg-off font-semibold text-ink" : "text-grey hover:bg-off/70 hover:text-ink"
                                                    }`}
                                                >
                                                    <span className={`flex-none ${active ? "text-ink" : "text-grey"}`}>{item.icon}</span>
                                                    <span className="truncate">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        <div className="mt-4">
                            <button
                                onClick={handleSignOut}
                                className="flex w-full min-w-0 items-center gap-2.5 px-2.5 py-1.5 text-[12.5px] text-alert transition hover:bg-off/70"
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

                <div className="min-w-0 pt-10 pr-6 pb-10 pl-6 sm:pr-10 sm:pb-10 sm:pl-10">{children}</div>
            </div>
        </div>
    );
}
