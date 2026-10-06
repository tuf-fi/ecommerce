"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LivePreviewPane from "@/components/admin/LivePreviewPane";
import Tooltip from "@/components/ui/Tooltip";
import { BTN_PRIMARY } from "@/components/admin/formClasses";
import { CONTENT_PANEL_WIDTH_COLLAPSED, CONTENT_PANEL_WIDTH_EXPANDED } from "@/library/adminStore";

// The WordPress "metabox" unit — every named box in the panel (Publish, Featured Image, Details) is one of these.
// Flat by design (no shadow-card): this rail sits directly beside the live preview, and the direction contract
// for this shell calls for the same flat-bordered language throughout, not the site's usual card elevation.
function MetaBox({ label, children }: { label: string; children: React.ReactNode }) {
    // `shrink-0` matters here: this box's own `overflow-hidden` disables the flex spec's automatic min-height
    // protection for flex children, so without it, the rail's flex-col would squash every card to fit the
    // available height instead of overflowing (and scrolling) once their combined content is taller than the rail.
    return (
        <div className="shrink-0 overflow-hidden border border-ink/10 bg-white">
            <div className="border-b border-ink/10 bg-off/50 px-4 py-2.5 font-mono text-[10px] tracking-[.14em] text-grey uppercase">{label}</div>
            <div className="p-4">{children}</div>
        </div>
    );
}

// Mirrors AdminSidebar's own CollapseIcon horizontally, since this panel sits on the right edge.
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
    );
}

function SaveIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 4h11l3 3v13H5V4Z" />
            <path d="M8 4v5h8V4" />
            <path d="M8 14h8v6H8Z" />
        </svg>
    );
}

// Shared shape for every single-entity content editor: live preview centered, everything else in a fixed collapsible right panel.
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
    preview,
    previewScroll = "pane",
    featuredImage,
    meta,
    guide,
    children,
}: {
    /** Also doubles as the Live Preview bar's label (e.g. "Live Preview — Hero") now that the rail no longer repeats it in its own header. */
    title: React.ReactNode;
    /** Small, minimal detail shown in the Publish box when the form is clean — e.g. a "Last updated" date. */
    titleMeta?: React.ReactNode;
    backLabel: string;
    backHref: string;
    /** Extra buttons rendered next to Back — e.g. Promotions' view-mode Edit/Delete icons. */
    topRightExtra?: React.ReactNode;
    saving: boolean;
    onSave: () => void;
    saveLabel?: string;
    /** Set false for read-only views (e.g. a promotion in "view" mode) where there's nothing to save — hides the whole Publish box. */
    showSaveBar?: boolean;
    /** True once the form has been touched since load/save — gates the leave-page confirmation and the Publish box's status line. */
    dirty?: boolean;
    preview: React.ReactNode;
    /** "pane" (default): preview is pinned to the viewport and scrolls internally, independent of the page — right
     *  for a single content block (Hero, Philosophy, ...). "page": preview flows normally and the whole admin page
     *  scrolls with it — for a preview that's genuinely a full page (Shop/Wishlist/Cart with all their real
     *  content), where a clipped inner scroll box would feel like scrolling inside a tiny window. */
    previewScroll?: "pane" | "page";
    /** Rendered in its own panel card — e.g. Hero/Blog/Promo's image square. Omit for editors with no image field. */
    featuredImage?: React.ReactNode;
    /** Rendered in a "Details" panel card — secondary fields beside Publish rather than in the main form. Omit if unused. */
    meta?: React.ReactNode;
    /** Rendered in a "Formatting Guide" panel card above everything else — instructions for the editor, not content. */
    guide?: React.ReactNode;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const panelWidth = collapsed ? CONTENT_PANEL_WIDTH_COLLAPSED : CONTENT_PANEL_WIDTH_EXPANDED;

    useEffect(() => {
        if (!dirty) return;
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            e.preventDefault();
        }
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [dirty]);

    // Cmd/Ctrl+S saves — this editor is modeled on WordPress's Publish workflow, where that binding is expected.
    useEffect(() => {
        if (!showSaveBar) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== "s" || !(e.metaKey || e.ctrlKey)) return;
            e.preventDefault();
            if (!saving) onSave();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showSaveBar, saving, onSave]);

    function handleBack() {
        if (dirty) {
            setConfirmLeave(true);
            return;
        }
        router.push(backHref);
    }

    // Shared by both the desktop panel and the mobile stacked fallback below.
    const cards = (
        <>
            {guide && <MetaBox label="Formatting Guide">{guide}</MetaBox>}
            {meta && <MetaBox label="Details">{meta}</MetaBox>}
            {showSaveBar && (
                <MetaBox label="Publish">
                    <div className="mb-3.5 flex items-center gap-2 font-mono text-[10.5px] tracking-[.06em] uppercase">
                        {dirty ? (
                            <>
                                <span className="h-1.5 w-1.5 flex-none rounded-full bg-pink-btn" />
                                <span className="text-pink-dark">Unsaved changes</span>
                            </>
                        ) : (
                            <span className="text-grey">{titleMeta ?? "Saved"}</span>
                        )}
                    </div>
                    <button onClick={onSave} disabled={saving} className={`${BTN_PRIMARY} w-full py-3`}>
                        {saving ? "Saving…" : saveLabel}
                    </button>
                </MetaBox>
            )}
            {featuredImage && <MetaBox label="Featured Image">{featuredImage}</MetaBox>}
            <MetaBox label="Content">{children}</MetaBox>
        </>
    );

    return (
        <div>
            {/* "pane" mode: fixed to the viewport at `lg`+ — same trick as the rail below (top/bottom pinned gives
                it a definite height with no dependency on ancestor h-full/flex-basis chains) — so the preview
                scrolls in place instead of growing the page. `right` tracks the rail's current width directly, no
                CSS-var indirection. "page" mode: normal block flow instead, margined clear of the rail, so a
                genuinely full-page preview scrolls with the admin page rather than in a small clipped box.
                Both: border-t-0 (no top border) keeps this column's header flush with the rail's own header, which
                has none either. Plain block flow below `lg` either way, where the stacked mobile layout takes over. */}
            <div
                className={
                    previewScroll === "page"
                        ? "overflow-hidden border-x border-b border-ink/10 bg-white lg:[margin-right:var(--panel-w)]"
                        : "overflow-hidden border-x border-b border-ink/10 bg-white transition-[right] duration-200 ease-in-out lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col"
                }
                style={previewScroll === "page" ? ({ "--panel-w": `${panelWidth}px` } as React.CSSProperties) : { right: `${panelWidth}px` }}
            >
                <LivePreviewPane label={title} scroll={previewScroll === "pane"}>
                    {preview}
                </LivePreviewPane>
            </div>

            {/* Same structural role AdminSidebar plays on the left; hidden below `lg`, where the mobile stack takes over. */}
            <aside
                className="fixed top-0 right-0 bottom-0 z-30 hidden flex-col overflow-hidden border-l border-ink/10 bg-off transition-[width] duration-200 lg:flex"
                style={{ width: panelWidth }}
            >
                <div className="flex h-[52px] flex-none items-center justify-between gap-2 border-b border-ink/10 bg-white px-4">
                    {!collapsed && (
                        <div className="flex min-w-0 items-center gap-2.5">
                            <button onClick={handleBack} className="flex items-center gap-1.5 text-[12px] font-medium text-ink hover:text-pink-dark">
                                <BackIcon /> Back to {backLabel}
                            </button>
                            {topRightExtra}
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        aria-label={collapsed ? "Expand panel" : "Collapse panel"}
                        className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-ink/60 transition hover:bg-off hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 ${collapsed ? "mx-auto" : ""}`}
                    >
                        <CollapseIcon collapsed={collapsed} />
                    </button>
                </div>

                {collapsed ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                        <Tooltip label={`Back to ${backLabel}`} side="left">
                            <button onClick={handleBack} aria-label={`Back to ${backLabel}`} className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1">
                                <BackIcon />
                            </button>
                        </Tooltip>
                        {showSaveBar && (
                            <Tooltip label={dirty ? `Unsaved — ${saveLabel}` : saveLabel} side="left">
                                <button
                                    onClick={onSave}
                                    disabled={saving}
                                    aria-label={saveLabel}
                                    className="relative flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white transition hover:bg-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 disabled:opacity-50"
                                >
                                    <SaveIcon />
                                    {dirty && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-pink-btn ring-2 ring-off" />}
                                </button>
                            </Tooltip>
                        )}
                    </div>
                ) : (
                    // min-h-0 overrides the flex item's default min-height:auto so this caps at the remaining height and actually scrolls.
                    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{cards}</div>
                )}
            </aside>

            {/* Mobile/tablet: panel content stacks below the preview instead of floating fixed. Title lives in the
                Live Preview bar above (see LivePreviewPane's `label`), not repeated here. */}
            <div className="mt-6 flex flex-col gap-5 lg:hidden">
                <div className="flex items-center justify-between gap-4">
                    <button onClick={handleBack} className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink hover:text-pink-dark">
                        <BackIcon /> Back to {backLabel}
                    </button>
                    {topRightExtra && <div className="flex items-center gap-2.5">{topRightExtra}</div>}
                </div>
                {cards}
            </div>

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

// Shared "not found" state for the single-entity editor routes, so a bad id/slug reads the same way everywhere.
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
