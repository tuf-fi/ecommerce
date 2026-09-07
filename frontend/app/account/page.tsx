"use client";

import { useState } from "react";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

function initials(name: string) {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
}

export default function AccountProfilePage() {
    const { customerName, customerEmail, showToast } = useStore();
    const [name, setName] = useState(customerName);
    const mounted = useMounted();

    const [saving, saveProfile] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: persist profile edits (name) against the backend API.
        await wait();
        showToast("success", "Profile updated.");
    });

    function changePhoto() {
        // TODO: wire up real photo upload (Cloudinary) once account editing is backed by the API.
        showToast("success", "Photo uploads aren't wired up in this preview.");
    }

    if (!mounted) return <AccountProfileSkeleton />;

    return (
        <div>
            <PageHeading>Personal Information</PageHeading>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
                <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                    <button
                        onClick={changePhoto}
                        aria-label="Change photo"
                        className="group relative flex h-24 w-24 flex-none items-center justify-center rounded-full bg-navy font-mono text-2xl text-white"
                    >
                        {initials(customerName)}
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy/0 text-white opacity-0 transition group-hover:bg-navy/60 group-hover:opacity-100">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
                                <circle cx="12" cy="13" r="3.5" />
                            </svg>
                        </span>
                    </button>

                    <div>
                        <div className="text-[15px] font-medium text-ink">{customerName}</div>
                        <div className="mb-2 text-[12px] text-grey">JPG, PNG or GIF. Max 2MB.</div>
                        <button
                            onClick={changePhoto}
                            className="text-[12px] font-semibold text-pink-dark underline underline-offset-2"
                        >
                            Change Photo
                        </button>
                    </div>
                </div>

                <form onSubmit={saveProfile} className="max-w-[420px]">
                    <div className="mb-4">
                        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Full Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30"
                        />
                    </div>
                    <div className="mb-2">
                        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Email Address</label>
                        <input
                            value={customerEmail}
                            disabled
                            className="w-full cursor-not-allowed border border-ink/10 bg-off px-4 py-3 text-sm text-grey outline-none"
                        />
                    </div>
                    <p className="mb-5 text-[11.5px] text-grey">Email is managed by your sign-in provider.</p>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-navy px-7 py-3 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy"
                    >
                        {!saving && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                        )}
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Mirrors PageHeading's border-b/h-10 row, the avatar circle + name/caption/
// link block, and the name/email form fields with their labels and the save
// button — so the mounted-gate swap doesn't jump the layout.
function AccountProfileSkeleton() {
    return (
        <div>
            <SkeletonGroup>
                <div className="mb-6 flex h-10 items-center justify-between border-b border-ink/10 pb-4">
                    <Skeleton className="h-[18px] w-44" />
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
                    <div className="flex flex-col items-center gap-4 lg:items-start">
                        <Skeleton tone="soft" className="h-24 w-24 flex-none rounded-full" />
                        <div className="flex flex-col items-center gap-2 lg:items-start">
                            <Skeleton className="h-[15px] w-28" />
                            <Skeleton tone="soft" className="h-3 w-36" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>

                    <div className="max-w-[420px]">
                        <div className="mb-4">
                            <Skeleton className="mb-1.5 h-[10.5px] w-20" />
                            <Skeleton tone="outline" className="h-11 w-full" />
                        </div>
                        <div className="mb-2">
                            <Skeleton className="mb-1.5 h-[10.5px] w-28" />
                            <Skeleton tone="outline" className="h-11 w-full" />
                        </div>
                        <Skeleton tone="soft" className="mb-5 h-3 w-64" />
                        <Skeleton tone="outline" className="h-11 w-40" />
                    </div>
                </div>
            </SkeletonGroup>
        </div>
    );
}
