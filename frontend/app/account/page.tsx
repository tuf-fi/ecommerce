"use client";

import { useRef, useState } from "react";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";
import { useAsyncAction } from "@/library/useAsyncAction";
import { validateAndReadImage } from "@/library/image-upload";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

function initials(name: string) {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
}

export default function AccountProfilePage() {
    const { customerName, customerEmail, customerAvatar, updateProfile, showToast } = useStore();
    const [name, setName] = useState(customerName);
    const mounted = useMounted();

    const [saving, saveProfile] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            showToast("error", "Your name can't be empty.");
            return;
        }
        if (await updateProfile({ name: name.trim() })) showToast("success", "Profile updated.");
    });

    const photoInput = useRef<HTMLInputElement>(null);
    const changePhoto = () => photoInput.current?.click();

    async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const result = await validateAndReadImage(file, "avatars");
        if (!result.ok) {
            showToast("error", result.reason);
            return;
        }
        // A local-only preview (hosting not configured) can't be saved, so it isn't.
        if (result.hosted && (await updateProfile({ avatarUrl: result.url }))) showToast("success", "Photo updated.");
    }

    if (!mounted) return <AccountProfileSkeleton />;

    return (
        <div>
            <PageHeading>Personal Information</PageHeading>

            <form onSubmit={saveProfile} className="max-w-[520px]">
                <div className="mb-10 flex items-center gap-6">
                    <button
                        type="button"
                        onClick={changePhoto}
                        aria-label="Change photo"
                        className="group relative flex h-24 w-24 flex-none items-center justify-center rounded-full bg-navy font-mono text-2xl text-white outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                    >
                        {customerAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customerAvatar} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                            initials(customerName)
                        )}
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy/0 text-white opacity-0 transition group-hover:bg-navy/60 group-hover:opacity-100 group-focus-visible:bg-navy/60 group-focus-visible:opacity-100">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
                                <circle cx="12" cy="13" r="3.5" />
                            </svg>
                        </span>
                    </button>
                    <div>
                        <button
                            type="button"
                            onClick={changePhoto}
                            className="border border-ink/20 px-4 py-2 text-[12px] font-semibold tracking-wide text-ink transition hover:border-navy hover:bg-navy hover:text-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                        >
                            Change photo
                        </button>
                        <input ref={photoInput} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                        <p className="mt-2 text-[11px] text-grey">JPG, PNG or GIF, up to 3MB.</p>
                    </div>
                </div>

                <div className="mb-8">
                    <label htmlFor="account-name" className="mb-1 block font-mono text-[11px] uppercase tracking-[.14em] text-grey">Full Name</label>
                    <input
                        id="account-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border-b border-ink/20 bg-transparent px-0.5 py-2.5 text-base text-ink outline-none transition focus:border-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1"
                    />
                    <p className="mt-2 text-[12px] text-grey">Shown on your orders and account.</p>
                </div>

                <div className="mb-10">
                    <div className="mb-1 font-mono text-[11px] uppercase tracking-[.14em] text-grey">Email Address</div>
                    <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-0.5 py-2.5">
                        <span className="min-w-0 truncate text-base text-ink">{customerEmail}</span>
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-none text-grey">
                            <rect x="5" y="11" width="14" height="9" rx="1.5" />
                            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                    </div>
                    <p className="mt-2 text-[12px] text-grey">Managed by your sign-in provider.</p>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-navy px-8 py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy"
                >
                    {saving ? "Saving…" : "Save changes"}
                </button>
            </form>
        </div>
    );
}

function AccountProfileSkeleton() {
    return (
        <div>
            <SkeletonGroup>
                <div className="mb-6 flex h-10 items-center justify-between border-b border-ink/10 pb-4">
                    <Skeleton className="h-[18px] w-44" />
                </div>

                <div className="max-w-[500px]">
                    <div className="mb-8 flex items-start gap-5">
                        <div className="flex w-20 flex-none flex-col items-center gap-1.5">
                            <Skeleton tone="soft" className="h-16 w-16 flex-none rounded-full" />
                            <Skeleton className="h-[11px] w-16" />
                            <Skeleton tone="soft" className="h-[10px] w-20" />
                        </div>
                        <div className="min-w-0 flex-1 pt-2">
                            <Skeleton className="mb-1.5 h-[10.5px] w-20" />
                            <Skeleton tone="outline" className="h-11 w-full" />
                            <Skeleton tone="soft" className="mt-1.5 h-3 w-40" />
                        </div>
                    </div>

                    <div className="mb-6 border-t border-ink/10 pt-5">
                        <Skeleton className="mb-1.5 h-[10.5px] w-28" />
                        <div className="flex items-center justify-between gap-4">
                            <Skeleton className="h-3 w-44" />
                            <Skeleton tone="soft" className="h-3 w-40" />
                        </div>
                    </div>

                    <Skeleton tone="outline" className="h-11 w-40" />
                </div>
            </SkeletonGroup>
        </div>
    );
}
