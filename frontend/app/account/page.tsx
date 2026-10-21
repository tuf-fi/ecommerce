"use client";

import { useRef, useState } from "react";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";
import { useAsyncAction } from "@/library/useAsyncAction";
import { validateAndReadImage } from "@/library/image-upload";
import { useMounted } from "@/library/useMounted";
import { formatPhone, normalizePhone, PHONE_ERROR } from "@/library/phone";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

function initials(name: string) {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
}

export default function AccountProfilePage() {
    const { customerName, customerEmail, customerPhone, customerAvatar, updateProfile, showToast } = useStore();
    const [name, setName] = useState(customerName);
    const [phone, setPhone] = useState(customerPhone ? formatPhone(customerPhone) : "");
    const mounted = useMounted();

    const [saving, saveProfile] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            showToast("error", "Your name can't be empty.");
            return;
        }
        const normalized = normalizePhone(phone);
        if (phone.trim() && !normalized) {
            showToast("error", PHONE_ERROR);
            return;
        }
        // A saved number can be changed but not cleared, since orders need one.
        if (!normalized && customerPhone) {
            showToast("error", "A mobile number is needed to place orders.");
            return;
        }
        if (await updateProfile({ name: name.trim(), ...(normalized ? { phone: normalized } : {}) })) {
            if (normalized) setPhone(formatPhone(normalized));
            showToast("success", "Profile updated.");
        }
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

            <form onSubmit={saveProfile} className="border border-ink/10 bg-white">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-4 border-b border-ink/10 p-5 sm:flex-nowrap sm:p-6">
                    <button
                        type="button"
                        onClick={changePhoto}
                        aria-label="Change photo"
                        className="group relative flex h-16 w-16 flex-none items-center justify-center rounded-full bg-navy font-mono text-title text-white outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                    >
                        {customerAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customerAvatar} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                            initials(customerName)
                        )}
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy/0 text-white opacity-0 transition group-hover:bg-navy/60 group-hover:opacity-100 group-focus-visible:bg-navy/60 group-focus-visible:opacity-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
                                <circle cx="12" cy="13" r="3.5" />
                            </svg>
                        </span>
                    </button>
                    <div className="min-w-0 flex-1 basis-40">
                        <h2 className="font-mono text-label uppercase tracking-[.14em] text-ink">Profile photo</h2>
                        <p className="mt-1.5 text-small text-grey">JPG, PNG or GIF, up to 3MB.</p>
                    </div>
                    <button
                        type="button"
                        onClick={changePhoto}
                        className="ui-btn ui-btn-secondary w-full flex-none sm:w-auto"
                    >
                        Change photo
                    </button>
                    <input ref={photoInput} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </div>

                <p className="m-0 px-5 pt-5 text-meta text-grey sm:px-6 sm:pt-6">Your name and mobile number go on orders so the courier can reach you. Email is managed by your sign-in provider.</p>

                <div className="grid gap-5 p-5 pt-4 sm:p-6 sm:pt-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="account-name" className="ui-label">Full Name</label>
                        <input id="account-name" value={name} onChange={(e) => setName(e.target.value)} className="ui-input" />
                    </div>
                    <div>
                        <label htmlFor="account-phone" className="ui-label">Mobile Number</label>
                        <input id="account-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="ui-input" />
                    </div>
                    <div>
                        <div className="ui-label">Email Address</div>
                        <div className="flex items-center justify-between gap-3 border border-ink/10 bg-off/60 px-4 py-2.5 text-small text-grey">
                            <span className="min-w-0 truncate">{customerEmail}</span>
                            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-none">
                                <rect x="5" y="11" width="14" height="9" rx="1.5" />
                                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end px-5 pb-5 sm:px-6 sm:pb-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="ui-btn ui-btn-primary"
                    >
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
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

                <div className="border border-ink/10 bg-white">
                    <div className="flex items-center gap-5 border-b border-ink/10 p-6">
                        <Skeleton tone="soft" className="h-16 w-16 flex-none rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-[11px] w-24" />
                            <Skeleton tone="soft" className="mt-2.5 h-3 w-40" />
                        </div>
                        <Skeleton tone="outline" className="h-10 w-32" />
                    </div>
                    <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i}>
                                <Skeleton className="mb-2 h-[11px] w-24" />
                                <Skeleton tone="soft" className="h-[42px] w-full" />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between px-6 pb-6">
                        <Skeleton tone="soft" className="h-3 w-64" />
                        <Skeleton tone="outline" className="h-10 w-36" />
                    </div>
                </div>
            </SkeletonGroup>
        </div>
    );
}
