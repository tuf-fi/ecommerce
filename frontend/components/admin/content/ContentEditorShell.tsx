"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LivePreviewPane from "@/components/admin/LivePreviewPane";
import { BTN_PRIMARY } from "@/components/admin/formClasses";

// Every single-entity content editor (Hero, page intros, static pages, blog
// posts, promotions) shares this shape: a back link, a title, a form on the
// left, a live preview on the right, and a save action. Centralizing it here
// means the sticky save bar and the unsaved-changes guard only had to be
// built once, and every editor gets them automatically.
export default function ContentEditorShell({
    title,
    titleMeta,
    backLabel,
    backHref,
    topRightExtra,
    saving,
    onSave,
    saveLabel = "Save Changes",
    showSaveBar = true,
    dirty = false,
    previewLabel,
    preview,
    children,
}: {
    title: React.ReactNode;
    /** Small, minimal detail shown to the right of the title — e.g. a "Last updated" date. */
    titleMeta?: React.ReactNode;
    backLabel: string;
    backHref: string;
    /** Extra buttons rendered next to the back link — e.g. Promotions' view-mode Edit/Delete icons. */
    topRightExtra?: React.ReactNode;
    saving: boolean;
    onSave: () => void;
    saveLabel?: string;
    /** Set false for read-only views (e.g. a promotion in "view" mode) where there's nothing to save. */
    showSaveBar?: boolean;
    /** True once the form has been touched since load/save — gates the leave-page confirmation. */
    dirty?: boolean;
    previewLabel: string;
    preview: React.ReactNode;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [confirmLeave, setConfirmLeave] = useState(false);

    useEffect(() => {
        if (!dirty) return;
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            e.preventDefault();
        }
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [dirty]);

    function handleBack() {
        if (dirty) {
            setConfirmLeave(true);
            return;
        }
        router.push(backHref);
    }

    return (
        <div>
            {/* No breadcrumb here — the admin topbar already renders the full
                "Admin / Content / Pages / X" trail for this route, so repeating
                it here was pure duplication. */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <button onClick={handleBack} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to {backLabel}
                </button>
                {topRightExtra && <div className="flex items-center gap-2.5">{topRightExtra}</div>}
            </div>

            {/* Preview stacked on top, full width, at its own natural height — a
                side-by-side split always confined "Desktop" preview to half the
                editor's width, which read as cramped/mobile-esque rather than
                desktop no matter how the box itself was sized. Stacking removes
                that ceiling entirely: the canvas gets the full editor width, and
                the device toggle only ever changes its width, never how much of
                it is visible — the page scrolls to the form below, not the other
                way around. */}
            <div className="overflow-hidden border border-ink/10 bg-white">
                <LivePreviewPane label={previewLabel}>{preview}</LivePreviewPane>
                <div className="px-7 pt-10 pb-7">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <h3 className="text-lg font-medium text-ink">{title}</h3>
                        {titleMeta && <span className="font-mono text-[11px] text-grey">{titleMeta}</span>}
                    </div>
                    {children}
                </div>
            </div>

            {showSaveBar && (
                <div className="mt-6 flex items-center justify-end gap-4">
                    {dirty && <span className="mr-auto font-mono text-[11px] tracking-[.06em] text-grey uppercase">Unsaved changes</span>}
                    <button onClick={onSave} disabled={saving} className={BTN_PRIMARY + " px-6 py-3"}>
                        {saving ? "Saving…" : saveLabel}
                    </button>
                </div>
            )}

            <ConfirmModal
                open={confirmLeave}
                title="Discard unsaved changes?"
                description={`Your edits to this ${backLabel === "Pages" ? "page" : backLabel.toLowerCase().replace(/s$/, "")} haven't been saved and will be lost.`}
                confirmLabel="Discard"
                onConfirm={() => router.push(backHref)}
                onClose={() => setConfirmLeave(false)}
            />
        </div>
    );
}

// Shared "not found" state for the three single-entity editor routes
// (page/[slug], blog/[id], promotions/[id]) so a bad id/slug reads the same
// way everywhere instead of each route hand-rolling its own copy.
export function ContentNotFound({ message, backLabel, backHref }: { message: string; backLabel: string; backHref: string }) {
    return (
        <div className="p-11 text-center text-[13px] text-grey">
            {message}{" "}
            <Link href={backHref} className="text-pink-dark underline">
                {backLabel}
            </Link>
        </div>
    );
}
