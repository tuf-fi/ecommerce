"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { Promo } from "@/library/admin/types";
import PromoBanner from "@/components/layout/PromoBanner";
import Toggle from "@/components/ui/Toggle";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ContentEditorShell, { ContentNotFound } from "@/components/admin/content/ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const BACK_HREF = "/admin/content?tab=promotions";

// Keyed by existing?.id ?? "new" from the parent, so switching between two
// different promotions (or from a promotion into "add new") remounts this
// fresh instead of needing an effect to reset the form.
function PromoEditorForm({
    existing,
    isNew,
    onSave,
    onDelete,
}: {
    existing: Promo | null;
    isNew: boolean;
    onSave: (data: Omit<Promo, "id">, id?: number) => void;
    onDelete: (id: number) => void;
}) {
    const router = useRouter();
    const [mode, setMode] = useState<"view" | "edit">(isNew ? "edit" : "view");
    const [text, setText] = useState(existing?.text ?? "");
    const [code, setCode] = useState(existing?.code ?? "");
    const [active, setActive] = useState(existing?.active ?? false);
    const [image, setImage] = useState<string | null>(existing?.image ?? null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [dirty, setDirty] = useState(false);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result as string);
            setDirty(true);
        };
        reader.readAsDataURL(file);
    }

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        if (isNew) {
            onSave({ text, code, image, active });
            setDirty(false);
            router.push(BACK_HREF);
        } else if (existing) {
            onSave({ text, code, image, active }, existing.id);
            setDirty(false);
            setMode("view");
        }
    });

    const disabled = mode === "view";

    return (
        <ContentEditorShell
            title={isNew ? "Add Promotion" : "Promotion"}
            backLabel="Promotions"
            backHref={BACK_HREF}
            saving={saving}
            onSave={handleSave}
            saveLabel="Save Promotion"
            showSaveBar={mode === "edit"}
            dirty={dirty}
            previewLabel="Top Banner (all pages)"
            topRightExtra={
                !isNew && mode === "view" ? (
                    <>
                        <Tooltip label="Delete">
                            <button onClick={() => setConfirmOpen(true)} aria-label="Delete promotion" className={ICON_BTN_DANGER}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M4 7h16" />
                                    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                    <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
                                    <path d="M10 11v6M14 11v6" />
                                </svg>
                            </button>
                        </Tooltip>
                        <Tooltip label="Edit">
                            <button onClick={() => setMode("edit")} aria-label="Edit promotion" className={ICON_BTN}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                </svg>
                            </button>
                        </Tooltip>
                    </>
                ) : undefined
            }
            preview={
                active ? (
                    <PromoBanner promo={{ id: existing?.id ?? 0, text, code, image, active }} />
                ) : (
                    <p className="p-6 text-center text-[12.5px] text-grey">
                        This promotion is turned off — it won&apos;t show on the site until &quot;Display this promo&quot; is on.
                    </p>
                )
            }
        >
            <div className="mb-5 flex items-center gap-3.5">
                <label className={`relative h-16 w-16 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft ${disabled ? "" : "cursor-pointer"}`}>
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-center font-mono text-[9px] text-ink/60">+ Image</span>
                    )}
                    {!disabled && <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />}
                </label>
                <span className="text-[11.5px] text-grey">Optional — reserved for future visual promo cards</span>
            </div>

            <div className="mb-4">
                <label htmlFor="promo-text" className={FIELD_LABEL}>Promo Text</label>
                <textarea
                    id="promo-text"
                    rows={2}
                    disabled={disabled}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setDirty(true);
                    }}
                    placeholder="e.g. 10% off your first order"
                    className={`${FIELD_INPUT} resize-y`}
                />
            </div>
            <div className="mb-5">
                <label htmlFor="promo-code" className={FIELD_LABEL}>Promo Code (optional)</label>
                <input
                    id="promo-code"
                    disabled={disabled}
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value);
                        setDirty(true);
                    }}
                    placeholder="e.g. RITUAL10"
                    className={FIELD_INPUT}
                />
            </div>
            <div className="flex items-center justify-between bg-off/60 px-4 py-3">
                <label htmlFor="promo-display-toggle" className="text-[13px] text-ink">Display this promo</label>
                <Toggle
                    id="promo-display-toggle"
                    checked={active}
                    onChange={
                        disabled
                            ? () => {}
                            : (v) => {
                                  setActive(v);
                                  setDirty(true);
                              }
                    }
                />
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Remove this promotion?"
                description={existing ? `"${existing.text}" will no longer show on the site.` : undefined}
                onConfirm={() => {
                    if (existing) onDelete(existing.id);
                    router.push(BACK_HREF);
                }}
                onClose={() => setConfirmOpen(false)}
            />
        </ContentEditorShell>
    );
}

export default function PromoEditorPage() {
    const params = useParams<{ id: string }>();
    const { promos, addPromo, updatePromo, deletePromo } = useContent();
    const mounted = useMounted();
    const isNew = params.id === "new";
    const existing = isNew ? null : (promos.find((p) => p.id === Number(params.id)) ?? null);

    if (!mounted) return <PromoEditorSkeleton />;

    if (!isNew && !existing) {
        return <ContentNotFound message="Promotion not found." backLabel="Back to Promotions" backHref={BACK_HREF} />;
    }

    function handleSave(data: Omit<Promo, "id">, id?: number) {
        if (id) updatePromo(id, data);
        else addPromo(data);
    }

    return <PromoEditorForm key={existing?.id ?? "new"} existing={existing} isNew={isNew} onSave={handleSave} onDelete={deletePromo} />;
}

// Mirrors ContentEditorShell's stacked shape (back link, then one bordered
// box holding the live-preview bar + a thin banner-shaped preview area on
// top, and the form below) plus PromoEditorForm's own fields: image square,
// promo text textarea, code input, and the active toggle row.
function PromoEditorSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 flex items-center justify-between gap-4">
                <Skeleton className="h-[12.5px] w-28" />
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <div className="border-b border-ink/10">
                    <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5">
                        <Skeleton tone="soft" className="h-[10.5px] w-44" />
                        <div className="flex items-center gap-1">
                            <Skeleton tone="soft" className="h-6 w-6" />
                            <Skeleton tone="soft" className="h-6 w-6" />
                            <Skeleton tone="soft" className="h-6 w-6" />
                        </div>
                    </div>
                    <Skeleton tone="faint" className="h-10 w-full" />
                </div>

                <div className="px-7 pt-10 pb-7">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <Skeleton className="h-[18px] w-28" />
                    </div>

                    <div className="mb-5 flex items-center gap-3.5">
                        <Skeleton tone="faint" className="h-16 w-16 flex-none" />
                        <Skeleton tone="soft" className="h-[11.5px] w-56" />
                    </div>

                    <div className="mb-4">
                        <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-20" />
                        <Skeleton tone="outline" className="h-16 w-full" />
                    </div>
                    <div className="mb-5">
                        <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-28" />
                        <Skeleton tone="outline" className="h-11 w-full" />
                    </div>
                    <div className="flex items-center justify-between bg-off/60 px-4 py-3">
                        <Skeleton tone="soft" className="h-[13px] w-32" />
                        <Skeleton tone="outline" className="h-6 w-11" />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-4">
                <Skeleton tone="outline" className="h-[46px] w-44" />
            </div>
        </SkeletonGroup>
    );
}
